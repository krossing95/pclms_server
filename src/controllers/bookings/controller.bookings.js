import DatabaseConnection from "../../config/config.db.js"
import { Regex } from "../../utils/static/index.js"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import url from "url"

export default function BookingControllers() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const bookingQueries = BookingsQuery()
    const validations = BookingsValidations()
    const { isTrueBodyStructure } = RequestBodyChecker()


    const getRequirements = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id')) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        const equipment_id = params.get('equipment_id')
        if (!equipment_id.match(regex.MONGOOBJECT)) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        try {
            const blockedDays = (await pool.query(bookingQueries.GETBLOCKEDDAYS)).rows
            let bookedDays = (await pool.query(bookingQueries.GETBOOKEDDAYS, [equipment_id, 3])).rows
            bookedDays = bookedDays.length > 0 ? bookedDays.filter(day => day.slots.length < 18).map(day => {
                return { ...day, name: 'Booked' }
            }) : []
            return res.status(200).json({
                message: '', code: '200', data: {
                    unavailable_days: [...bookedDays, ...blockedDays]
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const getSlots = (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id') || !params.get('date')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const equipment_id = params.get('equipment_id')
        const date = params.get('date')
        const validate = validations.validateSlotRequest({ equipment_id, date }, async () => {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            try {
                const getData = await pool.query(bookingQueries.GETSLOTSDATA, [equipment_id, date, 3])
                if (getData.rowCount === 0) return res.status(200).json({
                    message: '', code: '200', data: {
                        unavailable_slots: []
                    }
                })
                const usersSlotExists = getData.rows.some(row => row.user_id === userId)
                if (usersSlotExists) return res.status(412).json({ message: 'You have already booked for the equipment', code: '412', data: {} })
                let slots = []
                for (let i = 0; i < getData.rows.length; i++) {
                    const row = getData.rows[i]
                    slots = [...slots, ...row.slots]
                }
                return res.status(200).json({
                    message: '', code: '200', data: {
                        unavailable_slots: [...slots]
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const bookEquipment = async (req, res) => {

    }

    return {
        getRequirements, getSlots, bookEquipment
    }
}