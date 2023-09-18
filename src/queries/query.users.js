export default function UsersQuery() {
    const PAGINATE_USERS = `SELECT id, firstname, lastname, email, phone, usertype,
    is_verified, created_at, updated_at FROM users WHERE is_deleted = $1 
    ORDER BY firstname ASC LIMIT $2 OFFSET $3`

    return {
        PAGINATE_USERS
    }
}