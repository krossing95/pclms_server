export default function AuthQuery() {
    const CHECKUSERINSTANCE = `SELECT * FROM users WHERE email = $1 OR phone = $2`
    const CREATEUSER = `INSERT INTO users (id, firstname, lastname, email, phone, password, 
        created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`
    const GETUSER = `SELECT * FROM users WHERE id = $1`
    const GETPHONE = `SELECT * FROM users WHERE phone = $1`
    const VERIFYUSER = `UPDATE users SET is_verified = $1 WHERE id = $2`
    // Password reset requests
    const CLEAROLDREQUESTS = `DELETE FROM forgot_password_requests WHERE user_id = $1`
    const CREATEREQUEST = `INSERT INTO forgot_password_requests (user_id, code, datetime) VALUES ($1, $2, $3)`
    const GETREQUEST = `SELECT user_id, datetime, code FROM forgot_password_requests WHERE user_id = $1`
    return {
        CHECKUSERINSTANCE, CREATEUSER, GETUSER, GETPHONE, VERIFYUSER, CLEAROLDREQUESTS, CREATEREQUEST, GETREQUEST
    }
}