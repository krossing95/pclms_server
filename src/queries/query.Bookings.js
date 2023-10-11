export default function BookingsQuery() {
    const GETBLOCKEDDAYS = `SELECT id, name, date FROM blocked_days WHERE 
    date >= NOW() ORDER BY date ASC`
    const GETBOOKEDDAYS = `SELECT id, date, slots FROM bookings WHERE equipment_id = $1 AND 
    status < $2 AND date >= NOW() AND is_deleted = false`
    const GETSLOTSDATA = `SELECT id, user_id, slots FROM bookings WHERE equipment_id = $1 AND 
    date = $2 AND status != $3 AND date >= NOW() AND is_deleted = false`
    const REQUIREOPENEDBOOKINGHISTORY = `SELECT
    (SELECT COUNT(id) FROM bookings WHERE equipment_id = $1 AND user_id = $2 AND status < $3 AND date >= NOW() AND is_deleted = false) AS user_has_opened_booking,
    (SELECT COUNT(id) FROM bookings WHERE user_id = $2 AND status < $3 AND date >= NOW() AND is_deleted = false) AS total_opened_bookings`
    const CHECKEQUIPMENT = `SELECT e.id, e.name, e.description, e.system_error, e.functionality_status, 
    e.availability_status FROM equipment e WHERE e.is_deleted = $1 AND e.id = $2`
    const CREATEBOOKING = `INSERT INTO bookings (id, user_id, equipment_id, date, need_assist, slots, created_at, updated_at) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`
    const CANCELPASTBOOKINGS = `UPDATE bookings SET status = $1 WHERE date < NOW()`
    const PAGINATE_BOOKINGS = `SELECT b.id, b.date, b.slots, b.has_attended, b.need_assist, b.status,
    u.firstname, u.lastname, u.id AS user_id, e.name, 
    e.id AS equipment_id, b.created_at, b.updated_at, b.update_count FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = $1 AND b.is_deleted = false ORDER BY b.date ASC`
    const GETBOOKING = `SELECT b.id, b.date, b.slots, b.need_assist, b.status, b.has_attended,
    u.firstname, u.lastname, u.email, u.phone, u.id AS user_id, e.name, e.photo_url,
    e.id AS equipment_id, b.created_at, b.updated_at, b.update_count FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = $1 AND b.id = $2 AND b.is_deleted = false`
    const GETBOOKINGFORUPDATE = `SELECT b.id, b.date, b.slots, b.need_assist, b.status, b.has_attended,
    u.firstname, u.lastname, u.email, u.phone, u.id AS user_id, e.name, e.photo_url, e.id AS equipment_id, e.functionality_status, 
    e.availability_status, b.created_at, b.updated_at, b.update_count FROM bookings b INNER JOIN users u ON u.id = b.user_id
    INNER JOIN equipment e ON e.id = b.equipment_id WHERE e.is_deleted = $1 AND b.id = $2 AND b.is_deleted = false`
    const CANCELBOOKING = `UPDATE bookings SET status = $1 WHERE id = $2`
    const REMOVEBOOKING = `DELETE FROM bookings WHERE id = $1`
    const UPDATEBOOKING = `UPDATE bookings SET date = $1, status = $2, need_assist = $3, slots = $4, updated_at = $5, update_count = $6 WHERE id = $7`
    const GETADMINCONTACTS = `SELECT phone FROM users WHERE usertype = $1 AND is_deleted = false`
    const ASSIGNSTATUS = `UPDATE bookings SET status = $1, updated_at = $2 WHERE id = $3`
    const MARKBOOKING = `UPDATE bookings SET has_attended = $1, marked_by = $2 WHERE id = $3`
    return {
        GETBLOCKEDDAYS, GETBOOKEDDAYS, GETSLOTSDATA, CHECKEQUIPMENT, REQUIREOPENEDBOOKINGHISTORY,
        CREATEBOOKING, CANCELPASTBOOKINGS, PAGINATE_BOOKINGS, GETBOOKING, CANCELBOOKING, REMOVEBOOKING,
        GETBOOKINGFORUPDATE, UPDATEBOOKING, GETADMINCONTACTS, ASSIGNSTATUS, MARKBOOKING
    }
}