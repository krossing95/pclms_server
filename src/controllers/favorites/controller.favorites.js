import DatabaseConnection from "../../config/config.db.js"
import Pagination from "../../helpers/helper.pagination.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import FavoriteQuery from "../../queries/query.favorites.js"
import { Regex } from "../../utils/static/index.js"
import url from "url"

export default function FavoriteListController() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const { Setter, LocalPaginator } = Pagination()
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const favoriteQuery = FavoriteQuery()

    const get_favorites = async (req, res) => {
        try {
            const params = new URLSearchParams(url.parse(req.url, true).query)
            const { pageSize, page } = Setter(params, 1, resultPerPage)
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            const collection = await pool.query(favoriteQuery.PAGINATE_FAVORITES, [userId])
            const { list, totalCount, totalPages } = LocalPaginator(collection.rows, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    },
                    data_type: ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const search_favorites = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            equipment: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        const request_sender = RequestInformation(req, res)
        if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
        const userId = request_sender.user_id
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const collection = await pool.query(favoriteQuery.PAGINATE_FAVORITES, [userId])
            const matches = collection.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { list, totalCount, totalPages } = LocalPaginator(matches, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    },
                    data_type: totalPages > 1 ? 'search' : ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const statusConversion = (status) => {
        let converted_status = status.trim() === 'false' ? false : status.trim() === 'true' ? true : null
        return converted_status
    }
    const setDynamicQuery = (f_status, a_status) => {
        const conditional = `ORDER BY e.name ASC`
        const query = (f_status === null && a_status !== null) ?
            `${favoriteQuery.FILTERFAVORITESPREFIX}e.availability_status = ${a_status} ${conditional}`
            : (f_status !== null && a_status === null) ?
                `${favoriteQuery.FILTERFAVORITESPREFIX}e.functionality_status = ${f_status} ${conditional}`
                : (f_status !== null && a_status !== null) ?
                    `${favoriteQuery.FILTERFAVORITESPREFIX}e.functionality_status = ${f_status} AND e.availability_status = ${a_status} ${conditional}` :
                    ''
        return query
    }

    const filter_favorites = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            equipment: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        const request_sender = RequestInformation(req, res)
        if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
        const userId = request_sender.user_id
        const functionality_status = !params.get('functionality_status') ? '' : params.get('functionality_status')
        const availability_status = !params.get('availability_status') ? '' : params.get('availability_status')
        const f_status = statusConversion(functionality_status)
        const a_status = statusConversion(availability_status)
        const Query = setDynamicQuery(f_status, a_status)
        if (Query.length === 0) return res.status(200).json({ message: 'Filter is missing', code: '200', data: { ...structure } })
        try {
            const results = await pool.query(Query, [userId])
            const { list, totalCount, totalPages } = LocalPaginator(results.rows, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    equipment: [...list],
                    page_data: {
                        totalPages, totalCount, currentPage: page, pageSize
                    },
                    data_type: totalPages > 1 ? 'filter' : ''
                }
            })
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }


    return {
        get_favorites, search_favorites, filter_favorites
    }
}