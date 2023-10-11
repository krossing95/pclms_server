export default function HiddenBookingsQuery() {
    const PAGINATE_BOOKINGS = `SELECT b.id, b.date, b.slots, b.has_attended, b.need_assist, b.status,
    u.firstname, u.lastname, u.id AS user_id, e.name, 
    e.id AS equipment_id, b.created_at, b.updated_at, b.update_count FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = true OR b.is_deleted = true ORDER BY b.date ASC`
    const REMOVEBOOKING = `DELETE FROM bookings WHERE id = $1`
    return {
        PAGINATE_BOOKINGS, REMOVEBOOKING
    }
}