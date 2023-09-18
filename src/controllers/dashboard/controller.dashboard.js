import DatabaseConnection from "../../config/config.db.js"
import DashboardQuery from "../../queries/query.dashboard.js"

export default function DashboardController() {
    const { pool } = DatabaseConnection()
    const sqlQuery = DashboardQuery()
    const WSWW = 'Whoops! Something went wrong'

    const FetchUserData = async (res) => {
        // equipment, bookings, favorites
        try {
            const getData = await pool.query(sqlQuery.GETUSERDATA)
            const data = getData.rows[0]
            return res.status(200).json({
                message: '', code: '200', data: {
                    available_equipment: parseInt(data.available_equipment),
                    unavailable_equipment: parseInt(data.unavailable_equipment)
                }
            })
        } catch (error) {
            return res.status(500).json({ mesage: WSWW, code: '500', data: {} })
        }

    }
    const FetchAdminData = async (res) => {

    }

    const fetchData = async (req, res) => {
        const usertype = req.usertype
        if (usertype === process.env.LMS_USER) return FetchUserData(res)
        if (usertype === process.env.LMS_ADMIN) return FetchAdminData(res)
    }

    return {
        fetchData
    }
}