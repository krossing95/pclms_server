export default function DashboardQuery() {
    const GETUSERDATA = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = true ) AS available_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = false ) AS unavailable_equipment,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 3) AS closed_bookings,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 2 AND b.date >= NOW()) AS approved_bookings,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id INNER JOIN users u ON u.id = b.user_id 
    WHERE b.user_id = $1 AND e.is_deleted = false AND b.status = 1 AND b.date >= NOW()) AS pending_bookings,
    (SELECT COUNT(s.row_id) FROM saves s INNER JOIN equipment e ON s.equipment_id = e.id 
    WHERE user_id = $1 AND e.is_deleted = false AND s.is_saved = true) AS favorite_list`
    const GETADMINDATA = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = true ) AS available_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = false ) AS unavailable_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = true) AS recyclable_equipment,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id
    WHERE e.is_deleted = false AND b.status = 1 AND b.date >= NOW()) AS pending_bookings,
    (SELECT COUNT(b.id) FROM bookings b INNER JOIN equipment e ON e.id = b.equipment_id
    WHERE e.is_deleted = false AND b.status = 2 AND b.date >= NOW()) AS approved_bookings,
    (SELECT COUNT(id) FROM users WHERE is_deleted = false AND usertype = 2) AS administrators,
    (SELECT COUNT(id) FROM users WHERE is_deleted = false AND usertype = 1) AS non_administrators,
    (SELECT COUNT(id) FROM users WHERE is_deleted = false AND usertype = 3) AS blocked_users,
    `
    return {
        GETUSERDATA, GETADMINDATA
    }
}