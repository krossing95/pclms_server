export default function BookingsQuery() {
    const GETBLOCKEDDAYS = `SELECT id, name, date FROM blocked_days WHERE 
    date > NOW() ORDER BY date ASC`
    const GETBOOKEDDAYS = `SELECT id, date FROM bookings WHERE equipment_id = $1 AND 
    status < $2 AND date >= NOW()`

    return {
        GETBLOCKEDDAYS, GETBOOKEDDAYS
    }
}