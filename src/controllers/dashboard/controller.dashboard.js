import DatabaseConnection from "../../config/config.db.js"
import DashboardQuery from "../../queries/query.dashboard.js"
import RequestInformation from "../../helpers/helper.request_sender.js"

export default function DashboardController() {
    const { pool } = DatabaseConnection()
    const sqlQuery = DashboardQuery()
    const WSWW = 'Whoops! Something went wrong'

    const FetchUserData = async (userId) => {
        try {
            const getData = await pool.query(sqlQuery.GETUSERDATA, [userId])
            const data = getData.rows[0]
            return {
                available_equipment: parseInt(data.available_equipment),
                unavailable_equipment: parseInt(data.unavailable_equipment),
                closed_bookings: parseInt(data.closed_bookings),
                approved_bookings: parseInt(data.approved_bookings),
                pending_bookings: parseInt(data.pending_bookings),
                saved_equipment: parseInt(data.favorite_list),
                unsaved_equipment: (parseInt(data.available_equipment) + parseInt(data.unavailable_equipment)) - parseInt(data.favorite_list)
            }
        } finally {
            console.log(true)
        }
    }
    const FetchAdminData = async () => {
        try {
            const getData = await pool.query(sqlQuery.GETADMINDATA)
            const data = getData.rows[0]
            return {
                available_equipment: parseInt(data.available_equipment),
                unavailable_equipment: parseInt(data.unavailable_equipment),
                recyclable_equipment: parseInt(data.recyclable_equipment),
                pending_bookings: parseInt(data.pending_bookings),
                approved_bookings: parseInt(data.approved_bookings),
                administrators: parseInt(data.administrators),
                non_administrators: parseInt(data.non_administrators),
                blocked_users: parseInt(data.blocked_users)
            }
        } finally {
            console.log(true)
        }
    }

    const fetchData = async (req, res) => {
        const request_sender = RequestInformation(req, res)
        const requestObjKeys = Object.keys(request_sender)
        if (requestObjKeys.length === 0) return res.status(401).json({ message: 'Unauthorized request', code: '401', data: {} })
        const usertype = request_sender.usertype
        const userId = request_sender.user_id
        try {
            const data = usertype === Number(process.env.LMS_USER) ? await FetchUserData(userId) :
                usertype === Number(process.env.LMS_ADMIN) ? await FetchAdminData() : null
            if (!data) return res.status(500).json({ message: WSWW, code: '500', data: {} })
            return res.status(200).json({ message: '', code: '200', data })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    return {
        fetchData
    }
}