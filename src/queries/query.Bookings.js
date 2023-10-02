export default function BookingsQuery() {
    const GETBLOCKEDDAYS = `SELECT id, name, date FROM blocked_days WHERE 
    date > NOW() ORDER BY date ASC`
    const GETBOOKEDDAYS = `SELECT id, date, slots FROM bookings WHERE equipment_id = $1 AND 
    status < $2 AND date >= NOW()`
    const GETSLOTSDATA = `SELECT id, user_id, slots FROM bookings WHERE equipment_id = $1 AND 
    date = $2 AND status != $3 AND date >= NOW()`
    const REQUIREOPENEDBOOKINGHISTORY = `SELECT
    (SELECT COUNT(id) FROM bookings WHERE equipment_id = $1 AND user_id = $2 AND status < $3 AND date >= NOW()) AS user_has_opened_booking,
    (SELECT COUNT(id) FROM bookings WHERE user_id = $2 AND status < $3 AND date >= NOW()) AS total_opened_bookings`
    const CHECKEQUIPMENT = `SELECT e.id, e.name, e.description, e.system_error, e.functionality_status, 
    e.availability_status FROM equipment e WHERE e.is_deleted = $1 AND e.id = $2`
    const CREATEBOOKING = `INSERT INTO bookings (id, user_id, equipment_id, date, need_assist, slots, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`
    const CANCELPASTBOOKINGS = `UPDATE bookings SET status = $1 WHERE date < NOW()`
    const PAGINATE_BOOKINGS = `SELECT b.id, b.date, b.slots, b.need_assist, b.status,
    u.firstname, u.lastname, u.id AS user_id, e.name, 
    e.id AS equipment_id, b.created_at, b.updated_at FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = $1 AND b.user_id = $2 ORDER BY b.date ASC`
    const GETBOOKING = `SELECT b.id, b.date, b.slots, b.need_assist, b.status,
    u.firstname, u.lastname, u.id AS user_id, e.name, e.photo_url,
    e.id AS equipment_id, b.created_at, b.updated_at FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = $1 AND b.id = $2`
    const CANCELBOOKING = `UPDATE bookings SET status = $1 WHERE id = $2`
    const REMOVEBOOKING = `DELETE FROM bookings WHERE id = $1`

    return {
        GETBLOCKEDDAYS, GETBOOKEDDAYS, GETSLOTSDATA, CHECKEQUIPMENT, REQUIREOPENEDBOOKINGHISTORY,
        CREATEBOOKING, CANCELPASTBOOKINGS, PAGINATE_BOOKINGS, GETBOOKING, CANCELBOOKING, REMOVEBOOKING
    }
}