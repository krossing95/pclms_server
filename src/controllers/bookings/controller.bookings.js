import DatabaseConnection from "../../config/config.db.js"
import { Regex } from "../../utils/static/index.js"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"

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

    const getSlots = async (req, res) => {

    }

    const bookEquipment = async (req, res) => {

    }

    return {
        getRequirements, getSlots, bookEquipment
    }
}