import url from "url"
import { Regex } from "../../utils/static/index.js"
import DatabaseConnection from "../../config/config.db.js"
import BookingsQuery from "../../queries/query.bookings.js"

export default function BookingController() {
    const { MONGOOBJECT } = Regex
    const { pool } = DatabaseConnection()
    const { GETBLOCKEDDAYS, GETBOOKEDDAYS } = BookingsQuery()
    const WSWW = 'Whoops! Something went wrong'


    const getRequirements = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const equipment_id = params.get('equipment_id')
        if (!equipment_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getBlockedDays = await pool.query(GETBLOCKEDDAYS)
            const blockedDays = getBlockedDays.rows
            const getBookedDays = await pool.query(GETBOOKEDDAYS, [equipment_id, 3])
            let bookedDays = getBookedDays.rows
            if (bookedDays.length === 0) return res.status(200).json({
                message: '', code: '200', data: {
                    unavailable_days: [...blockedDays]
                }
            })
            bookedDays = bookedDays.filter(day => day.slots.length < 18).map(day => {
                return { ...day, name: 'Booked' }
            })
            return res.status(200).json({
                message: '', code: '200', data: {
                    unavailable_days: [...bookedDays, ...blockedDays]
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }


    return {
        getRequirements
    }
}