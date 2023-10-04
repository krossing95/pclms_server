export default function DashboardQuery() {
    const GETUSERDATA = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = true ) AS available_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = false ) AS unavailable_equipment,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 3) AS closed_bookings,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 2) AS approved_bookings,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 1) AS pending_bookings,
    (SELECT COUNT(s.row_id) FROM saves s INNER JOIN equipment e ON s.equipment_id = e.id 
    WHERE user_id = $1 AND e.is_deleted = false AND s.is_saved = true) AS favorite_list`

    return {
        GETUSERDATA
    }
}