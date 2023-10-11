import DatabaseConnection from "../../config/config.db.js"
import HiddenEquipmentQuery from "../../queries/query.hidden_equipment.js"
import url from "url"
import Pagination from "../../helpers/helper.pagination.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { Regex } from "../../utils/static/index.js"

export default function HiddenEquipmentControllers() {
    const { pool } = DatabaseConnection()
    const hiddenEquipmentQueries = HiddenEquipmentQuery()
    const { GetPageParams, Setter, LocalPaginator } = Pagination()
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const { isTrueBodyStructure } = RequestBodyChecker()
    const regex = Regex
    const WSWW = 'Whoops! Something went wrong'

    const getHiddenEquipment = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
            const paginationData = await GetPageParams(pageSize, 'equipment', `is_deleted = true`)
            const collection = await pool.query(hiddenEquipmentQueries.PAGINATE_HIDDEN_EQUIPMENT, [pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    equipment: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    },
                    data_type: ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const searchHiddenEquipment = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            equipment: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const getList = await pool.query(hiddenEquipmentQueries.GETHIDDENEQUIPMENTFORSEARCH)
            const matches = getList.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { list, totalCount, totalPages } = LocalPaginator(matches, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    },
                    data_type: totalPages > 1 ? 'search' : ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const retrieveHiddenEquipment = async (req, res) => {
        let { id } = req.body
        const expected_payload = ['id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!id.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getItem = await pool.query(hiddenEquipmentQueries.GETHIDDENEQUIPMENT, [id])
            if (getItem.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getItem.rows[0]
            if (!data.is_deleted) return res.status(412).json({ message: 'Action could not be executed', code: '412', data: {} })
            await pool.query(hiddenEquipmentQueries.RETRIEVEEQUIPMENT, [id])

            const params = new URLSearchParams(url.parse(req.url, true).query)
            const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
            const paginationData = await GetPageParams(pageSize, 'equipment', `is_deleted = true`)
            const collection = await pool.query(hiddenEquipmentQueries.PAGINATE_HIDDEN_EQUIPMENT, [pageSize, offset])
            return res.status(200).json({
                message: 'Equipment retrieved successfully', code: '200', data: {
                    equipment: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    },
                    data_type: ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    return {
        getHiddenEquipment, searchHiddenEquipment, retrieveHiddenEquipment
    }
}