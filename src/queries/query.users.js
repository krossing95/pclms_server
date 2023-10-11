export default function UsersQuery() {
    const PAGINATE_USERS = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE is_deleted = $1 
    ORDER BY firstname ASC LIMIT $2 OFFSET $3`
    const GETUSERSFORSEARCH = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE is_deleted = $1 ORDER BY firstname ASC`
    const GETUSER = `SELECT row_id, id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE id = $1`
    const UPDATEUSER = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, usertype = $5,
    updated_at = $6 WHERE id = $7`
    const CHECKUSERRELATIONS = `SELECT
    (SELECT COUNT(e.id) FROM equipment e INNER JOIN users u ON 
    e.created_by = u.id WHERE u.id = $1)  AS equipments_registered_by_user,
    (SELECT COUNT(b.id) FROM bookings b WHERE b.marked_by = $1) AS bookings_marked_by_user,
    (SELECT COUNT(b.id) FROM bookings b WHERE b.user_id = $1) AS bookings_by_user`

    const DELETEUSER = `DELETE FROM users WHERE id = $1`
    const GETPASSWORD = `SELECT password FROM users WHERE id = $1`
    const UPDATEPASSWORD = `UPDATE users SET password = $1 WHERE id = $2`
    const CLEARCREDENTIALS = `UPDATE users SET email = $1, phone = $1, is_deleted = $2 WHERE id = $3`

    return {
        PAGINATE_USERS, GETUSERSFORSEARCH, GETUSER, UPDATEUSER, CHECKUSERRELATIONS,
        DELETEUSER, CLEARCREDENTIALS, GETPASSWORD, UPDATEPASSWORD
    }
}