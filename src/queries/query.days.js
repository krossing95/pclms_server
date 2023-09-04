export default function DayQuery() {
    const GETSIMILARDAY = `SELECT * FROM blocked_days WHERE date = $1 OR name = $2`
    const SAVEDAY = `INSERT INTO blocked_days (id, name, date, created_at, updated_at) VALUES ($1, $2, $3, $4, $4) RETURNING id`
    const GETDAYS = `SELECT id, name, date, created_at, updated_at FROM blocked_days ORDER BY date ASC LIMIT $1`
    const UPDATEDATE = `UPDATE blocked_days SET date = $1, name = $2, updated_at = $3 WHERE id = $4`
    const GETDAY = `SELECT * FROM blocked_days WHERE id = $1`
    const DELETEDAY = `DELETE FROM blocked_days WHERE id = $1`
    return {
        GETSIMILARDAY, SAVEDAY, GETDAYS, UPDATEDATE, GETDAY, DELETEDAY
    }
    // const SAVEDATE = `INSERT INTO blocked_days (date, name, created_at, updated_at, day_id) VALUES ($1, $2, $3, $3, $4)`
    // const GETBLOCKEDDAY = `SELECT * FROM blocked_days WHERE date = $1`
    // const GETBLOCKEDDAYS = `SELECT day_id, name, date, created_at, updated_at FROM blocked_days ORDER BY date ASC`
    // const UPDATEDATE = `UPDATE blocked_days SET date = $1, name = $2, updated_at = $3 WHERE day_id = $4`
    // const REMOVEDAY = ``
    // const REMOVEOLDDAYS = `DELETE FROM blocked_days WHERE date < NOW() - INTERVAL '1 DAY'`
}