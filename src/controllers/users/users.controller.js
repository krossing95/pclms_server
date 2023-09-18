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
    const { PAGINATE_USERS } = UsersQuery()
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

    return {
        getUsers
    }
}