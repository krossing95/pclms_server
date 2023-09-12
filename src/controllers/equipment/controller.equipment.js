import url from 'url'
import DatabaseConnection from '../../config/config.db.js'
import EquipmentQuery from '../../queries/query.equipment.js'
import Pagination from '../../helpers/helper.pagination.js'
import RequestBodyChecker from '../../helpers/helper.request_checker.js'
import EquipmentValidations from '../../validators/equipment/validator.equipment.js'
import { ObjectId } from 'bson'
import StringManipulators from '../../helpers/helper.string_methods.js'
import RequestInformation from '../../helpers/helper.request_sender.js'
import { Regex } from '../../utils/static/index.js'
import PhotoUploader from '../../helpers/helper.photo_upload.js'

export default function EquipmentController() {
    const { pool } = DatabaseConnection()
    const { ImageStorage, ImageDestroy } = PhotoUploader()
    const WSWW = 'Whoops! Something went wrong'
    const { PAGINATE_EQUIPMENT, CHECKEQUIPMENT, SAVEEQUIPMENT, GETEQUIPMENTFORSEARCH, FILTEREQUIPMENTPREFIX,
        GETEQUIPMENT, SAVEFILE, GETEQUIPMENTBYNAME, UPDATEEQUIPMENT
    } = EquipmentQuery()
    const { Setter, GetPageParams, LocalPaginator } = Pagination()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateEquipment } = EquipmentValidations()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const resultPerPage = 20
    const { MONGOOBJECT } = Regex

    const getEquipment = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
            const paginationData = await GetPageParams(pageSize, 'equipment', `is_deleted = false`)
            const collection = await pool.query(PAGINATE_EQUIPMENT, [false, pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    equipment: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const CheckEquipment = async (name) => {
        try {
            const check = await pool.query(CHECKEQUIPMENT, [name])
            return parseInt(check.rows[0].equipment_exists)
        } finally {
            console.log(true)
        }
    }

    const createEquipment = async (req, res) => {
        let { name, description, system_error, functionality_status, availability_status } = req.body
        const expected_payload = [
            'name', 'description', 'system_error', 'functionality_status', 'availability_status'
        ]
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateEquipment(req.body, async () => {
            try {
                name = cleanSCW(name)
                description = cleanExcessWhiteSpaces(description)
                system_error = cleanExcessWhiteSpaces(system_error)
                const checkExistingItem = await CheckEquipment(name)
                if (checkExistingItem > 0) return res.status(412).json({ message: 'Record exists already', code: '412', data: {} })
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id')) return res.status(412).json({ message: 'Cannot access this resource', code: '412', data: {} })
                const id = (new ObjectId()).toString()
                const timestamp = (new Date()).toISOString()
                const created_by = request_sender.user_id
                await pool.query(SAVEEQUIPMENT, [id, created_by, name, description, system_error, functionality_status, availability_status, timestamp])

                const params = new URLSearchParams(url.parse(req.url, true).query)
                const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
                const paginationData = await GetPageParams(pageSize, 'equipment', `is_deleted = false`)
                const collection = await pool.query(PAGINATE_EQUIPMENT, [false, pageSize, offset])
                return res.status(200).json({
                    message: 'Record created successfully', code: '201', data: {
                        equipment: [...collection.rows],
                        page_data: {
                            ...paginationData, currentPage: page, pageSize
                        }
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const searchEquipment = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            equipment: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            }
        }
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const getList = await pool.query(GETEQUIPMENTFORSEARCH, [false])
            const matches = getList.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { list, totalCount, totalPages } = LocalPaginator(matches, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const statusConversion = (status) => {
        let converted_status = status.trim() === 'false' ? false : status.trim() === 'true' ? true : null
        return converted_status
    }
    const setDynamicQuery = (f_status, a_status) => {
        const conditional = `ORDER BY e.name ASC`
        const query = (f_status === null && a_status !== null) ?
            `${FILTEREQUIPMENTPREFIX}e.availability_status = ${a_status} ${conditional}`
            : (f_status !== null && a_status === null) ?
                `${FILTEREQUIPMENTPREFIX}e.functionality_status = ${f_status} ${conditional}`
                : (f_status !== null && a_status !== null) ?
                    `${FILTEREQUIPMENTPREFIX}e.functionality_status = ${f_status} AND e.availability_status = ${a_status} ${conditional}` :
                    ''
        return query
    }
    const filterEquipment = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
        const structure = {
            equipment: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            }
        }
        const functionality_status = !params.get('functionality_status') ? '' : params.get('functionality_status')
        const availability_status = !params.get('availability_status') ? '' : params.get('availability_status')
        const f_status = statusConversion(functionality_status)
        const a_status = statusConversion(availability_status)
        const Query = setDynamicQuery(f_status, a_status)
        if (Query.length === 0) return res.status(200).json({ message: 'Filter is missing', code: '200', data: { ...structure } })
        try {
            const results = await pool.query(Query, [false])
            const { list, totalCount, totalPages } = LocalPaginator(results.rows, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const getOneEquipment = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const id = params.get('equipment_id')
        try {
            const getData = await pool.query(GETEQUIPMENT, [false, id])
            if (getData.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            return res.status(200).json({ message: '', code: '200', data: { ...getData.rows[0] } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const equipmentFileUpload = async (req, res) => {
        let { img_url, id } = req.body
        const expected_payload = ['img_url', 'id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!id.match(MONGOOBJECT) || typeof img_url.split(',', 2)[0] === 'undefined') return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const leftHandSide = img_url.split(',', 2)[0]
        if (leftHandSide !== "data:image/png;base64" &&
            leftHandSide !== "data:image/jpeg;base64" &&
            leftHandSide !== "data:image/jpg;base64" &&
            leftHandSide !== "data:image/webp;base64") return res.status(412).json({ message: 'No file selected', code: '412', data: {} })
        try {
            const getData = await pool.query(GETEQUIPMENT, [false, id])
            if (getData.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getData.rows[0]
            const truePhoto = img_url.split(',', 2).length
            const photoUpload = truePhoto !== 2 ? null : await ImageStorage(data.photo_id, img_url, 'equipment')
            const photoId = !photoUpload ? data.photo_id : photoUpload.photo_id
            const photoUrl = !photoUpload ? data.photo_url : photoUpload.secure_url
            const timestamp = (new Date()).toISOString()
            await pool.query(SAVEFILE, [photoId, photoUrl, timestamp, id])
            return res.status(200).json({ message: 'Photo upload was successful', code: '200', data: { ...data, cloud_photo: photoUrl } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const EquipmentUpdate = async (res, data, id, name, description, system_error, functionality_status, availability_status) => {
        try {
            const timestamp = (new Date()).toISOString()
            await pool.query(UPDATEEQUIPMENT, [name, description, system_error, functionality_status, availability_status, timestamp, id])
            return res.status(200).json({
                message: 'Record successfully updated', code: '200', data: {
                    ...data,
                    name,
                    description,
                    system_error,
                    functionality_status,
                    availability_status,
                    updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const updateEquipment = async (req, res) => {
        let { id, name, description, system_error, functionality_status, availability_status } = req.body
        const expected_payload = [
            'id', 'name', 'description', 'system_error', 'functionality_status', 'availability_status'
        ]
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!id.match(MONGOOBJECT)) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
        const validate = validateEquipment(req.body, async () => {
            try {
                name = cleanSCW(name)
                description = cleanExcessWhiteSpaces(description)
                system_error = cleanExcessWhiteSpaces(system_error)
                const getData = await pool.query(GETEQUIPMENT, [false, id])
                if (getData.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const checkExistingItem = await pool.query(GETEQUIPMENTBYNAME, [name])
                const data = getData.rows[0]
                if (checkExistingItem.rowCount === 0) return EquipmentUpdate(res, data, id, name, description, system_error, functionality_status, availability_status)
                const isOwned = checkExistingItem.rows.some(item => item.id === id)
                if (!isOwned) return res.status(412).json({ message: 'Record with same name exists already', code: '412', data: {} })
                return EquipmentUpdate(res, data, id, name, description, system_error, functionality_status, availability_status)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const removeEquipment = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const id = params.get('id')
    }
    return {
        getEquipment, createEquipment, searchEquipment, filterEquipment, getOneEquipment,
        equipmentFileUpload, updateEquipment, removeEquipment
    }
}