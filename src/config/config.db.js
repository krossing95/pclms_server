import pg from 'pg'
import dotenv from 'dotenv'

export default function DatabaseConnection() {
    dotenv.config()
    const { Pool } = pg
    const pool = new Pool({
        connectionString: process.env.LMS_DBCONN
    })
    return { pool }
}