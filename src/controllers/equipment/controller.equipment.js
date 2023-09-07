import url from 'url'
import DatabaseConnection from '../../config/config.db.js'
import EquipmentQuery from '../../queries/query.equipment.js'
import Pagination from '../../helpers/helper.pagination.js'
import RequestBodyChecker from '../../helpers/helper.request_checker.js'
import EquipmentValidations from '../../validators/equipment/validator.equipment.js'
import { ObjectId } from 'bson'
import StringManipulators from '../../helpers/helper.string_methods.js'
import RequestInformation from '../../helpers/helper.request_sender.js'

export default function EquipmentController() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const { PAGINATE_EQUIPMENT, CHECKEQUIPMENT, SAVEEQUIPMENT, GETEQUIPMENTFORSEARCH, FILTEREQUIPMENTPREFIX } = EquipmentQuery()
    const { Setter, GetPageParams, LocalPaginator } = Pagination()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateEquipment } = EquipmentValidations()
    const { cleanSCW, cleanExcessWhiteSpaces, makeSluggish } = StringManipulators()
    const resultPerPage = 20

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
                const slug = `${makeSluggish(name)}-${(new ObjectId()).toString()}`
                await pool.query(SAVEEQUIPMENT, [id, created_by, name, slug, description, system_error, functionality_status, availability_status, timestamp])

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
    return {
        getEquipment, createEquipment, searchEquipment, filterEquipment
    }
}