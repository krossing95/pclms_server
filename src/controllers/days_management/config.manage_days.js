import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import DayQuery from "../../queries/query.days.js"
import DaysValidations from "../../validators/days/validator.days.js"
import moment from "moment"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import Pagination from "../../helpers/helper.pagination.js"

const ConfigureDays = () => {
    const { pool } = DatabaseConnection()
    const { GETSIMILARDAY, SAVEDAY, PAGINATE_DAYS, UPDATEDATE, GETDAY, DELETEDAY, GETDAYFORSEARCH } = DayQuery()
    const WSWW = 'Whoops! Something went wrong'
    const { MONGOOBJECT } = Regex
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateDay } = DaysValidations()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const resultPerPage = 5

    const CheckSimilarDay = async (name, date) => {
        try {
            const check = await pool.query(GETSIMILARDAY, [date, name])
            return check
        } finally {
            console.log(true)
        }
    }

    const createDay = async (req, res) => {
        let { name, date } = req.body
        const expected_payload = ['name', 'date']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateDay(req.body, async () => {
            try {
                name = cleanSCW(name)
                const similar_days = await CheckSimilarDay(name, date)
                if (similar_days.rowCount > 0) return res.status(412).json({ message: 'Record already exists', code: '412', data: {} })
                const id = (new ObjectId()).toString()
                const timestamp = (new Date()).toISOString()
                const save = await pool.query(SAVEDAY, [id, name, date, timestamp])
                if (save.rowCount !== 1) return res.status(412).json({ message: 'Record could not be saved', code: '412', data: {} })
                const params = new URLSearchParams(url.parse(req.url, true).query)
                const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
                const paginationData = await GetPageParams(pageSize, 'blocked_days', '')
                const collection = await pool.query(PAGINATE_DAYS, [pageSize, offset])
                return res.status(201).json({
                    message: `${moment(date).format('LL')} has been blocked`, code: '201', data: {
                        blocked_days: [...collection.rows],
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

    const getDays = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
        try {
            const paginationData = await GetPageParams(pageSize, 'blocked_days', '')
            const collection = await pool.query(PAGINATE_DAYS, [pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    blocked_days: [...collection.rows],
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

    const DayUpdate = async (res, id, name, date, timestamp, record) => {
        try {
            await pool.query(UPDATEDATE, [date, name, timestamp, id])
            return res.status(200).json({
                message: 'Successful record update', code: '200', data: {
                    ...record,
                    name,
                    date,
                    updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const updateDay = async (req, res) => {
        let { name, date, id } = req.body
        const expected_payload = ['name', 'date', 'id']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateDay(req.body, async () => {
            try {
                const getRecord = await pool.query(GETDAY, [id])
                if (getRecord.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const record = getRecord.rows[0]
                name = cleanSCW(name)
                const timestamp = (new Date()).toISOString()
                const similar_days = await CheckSimilarDay(name, date)
                if (similar_days.rowCount === 0) return DayUpdate(res, id, name, date, timestamp, record)
                const isNotOwned = similar_days.rows.some(item => item.id !== id)
                if (isNotOwned) return res.status(412).json({ message: 'Cannot update record with existing information', code: '412', data: {} })
                return DayUpdate(res, id, name, date, timestamp, record)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const deleteDay = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const id = params.get('id')
        if (!id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getRecord = await pool.query(GETDAY, [id])
            if (getRecord.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            await pool.query(DELETEDAY, [id])
            return res.status(200).json({ message: 'Record was successfully', code: '200', data: {} })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const searchDays = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            blocked_days: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const getList = await pool.query(GETDAYFORSEARCH)
            const matches = getList.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { list, totalCount, totalPages } = LocalPaginator(matches, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    blocked_days: [...list],
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

    return {
        createDay, getDays, updateDay, deleteDay, searchDays
    }
}
export default ConfigureDays