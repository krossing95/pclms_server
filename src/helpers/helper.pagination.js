import DatabaseConnection from "../config/config.db.js"

export default function Pagination() {
    const { pool } = DatabaseConnection()
    const Setter = (params, defaultPageNumber, defaultPageDensity) => {
        const page = parseInt(params.get('page')) || parseInt(defaultPageNumber)
        const pageSize = parseInt(params.get('results-per-page')) || parseInt(defaultPageDensity)
        const offset = (page - 1) * pageSize
        return { page, pageSize, offset }
    }
    const GetPageParams = async (pageSize, model, conditions) => {
        const query = `SELECT total_count,
            CEIL(total_count::float / ${pageSize}) AS total_pages
                FROM (
                    SELECT COUNT(*) AS total_count
                FROM ${model}${conditions.length > 0 ? ` WHERE ${conditions}` : ''}
            ) AS subquery`
        try {
            const countResult = await pool.query(query)
            return {
                totalCount: parseInt(countResult.rows[0].total_count),
                totalPages: parseInt(countResult.rows[0].total_pages)
            }
        } finally {
            console.log('finally')
        }
    }
    const LocalPaginator = (array, resultPerPage, pageNumber) => {
        const startIndex = (pageNumber - 1) * resultPerPage
        const endIndex = startIndex + resultPerPage
        const paginatedArray = array.slice(startIndex, endIndex)
        const totalPages = Math.ceil(array.length / resultPerPage)
        return {
            list: paginatedArray,
            totalPages,
            totalCount: parseInt(array.length)
        }
    }
    return {
        Setter, GetPageParams, LocalPaginator
    }
}