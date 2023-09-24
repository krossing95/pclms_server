export default function BookingsQuery() {
    const GETBLOCKEDDAYS = `SELECT id, name, date FROM blocked_days WHERE 
    date > NOW() ORDER BY date ASC`
    const GETBOOKEDDAYS = `SELECT id, date FROM bookings WHERE equipment_id = $1 AND 
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
    return {
        GETBLOCKEDDAYS, GETBOOKEDDAYS, GETSLOTSDATA, CHECKEQUIPMENT, REQUIREOPENEDBOOKINGHISTORY,
        CREATEBOOKING, CANCELPASTBOOKINGS
    }
}