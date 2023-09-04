import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import DayQuery from "../../queries/query.days.js"
import DaysValidations from "../../validators/days/validator.days.js"
import moment from "moment"
import url from "url"
import { Regex } from "../../utils/static/index.js"

const ConfigureDays = () => {
    const { pool } = DatabaseConnection()
    const { GETSIMILARDAY, SAVEDAY, GETDAYS, UPDATEDATE, GETDAY, DELETEDAY } = DayQuery()
    const WSWW = 'Whoops! Something went wrong'
    const { MONGOOBJECT } = Regex
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateDay } = DaysValidations()
    const { cleanSCW } = StringManipulators()

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
                return res.status(201).json({ message: `${moment(date).format('LL')} has been blocked`, code: '201', data: { id, name, date, created_at: timestamp, updated_at: timestamp } })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const getDays = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const limit = !params.get('limit') ? 10 : parseInt(params.get('limit'))
        try {
            const days = await pool.query(GETDAYS, [limit])
            return res.status(200).json({ message: '', code: '200', data: { blocked_days: [...days.rows] } })
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

    return {
        createDay, getDays, updateDay, deleteDay
    }
}
export default ConfigureDays