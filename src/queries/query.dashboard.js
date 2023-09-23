export default function DashboardQuery() {
    const GETUSERDATA = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = true ) AS available_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = false ) AS unavailable_equipment,
    (SELECT COUNT(s.row_id) FROM saves s INNER JOIN equipment e ON s.equipment_id = e.id 
    WHERE user_id = $1 AND e.is_deleted = false AND s.is_saved = true) AS favorite_list`

    return {
        GETUSERDATA
    }
}