import DatabaseConnection from "../../config/config.db.js"
import Pagination from "../../helpers/helper.pagination.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import UsersQuery from "../../queries/query.users.js"
import { Regex } from "../../utils/static/index.js"
import url from "url"

export default function UsersController() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const { MONGOOBJECT } = Regex
    const { PAGINATE_USERS, GETUSERSFORSEARCH } = UsersQuery()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)

    const getUsers = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
        try {
            const paginationData = await GetPageParams(pageSize, 'users', `is_deleted = false`)
            const collection = await pool.query(PAGINATE_USERS, [false, pageSize, offset])
            return res.status(200).json({
                message: '', code: '200', data: {
                    users: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    },
                    data_type: ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const searchUsers = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            users: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const getList = await pool.query(GETUSERSFORSEARCH, [false])
            const matches = getList.rows.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const { list, totalCount, totalPages } = LocalPaginator(matches, resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    ...structure,
                    users: [...list],
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


    return {
        getUsers, searchUsers
    }
}