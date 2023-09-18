export default function UsersQuery() {
    const PAGINATE_USERS = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE is_deleted = $1 
    ORDER BY firstname ASC LIMIT $2 OFFSET $3`
    const GETUSERSFORSEARCH = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE is_deleted = $1 ORDER BY firstname ASC`
    const GETUSER = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE id = $1`
    const UPDATEUSER = `UPDATE users SET firstname = $1, lastname = $2, email = $3, phone = $4, usertype = $5,
    updated_at = $6 WHERE id = $7`

    return {
        PAGINATE_USERS, GETUSERSFORSEARCH, GETUSER, UPDATEUSER
    }
}