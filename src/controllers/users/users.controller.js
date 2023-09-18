import DatabaseConnection from "../../config/config.db.js"
import Pagination from "../../helpers/helper.pagination.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import UsersQuery from "../../queries/query.users.js"
import url from "url"
import UserValidations from "../../validators/users/validate.users.js"
import AuthQuery from "../../queries/query.auth.js"

export default function UsersController() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const { PAGINATE_USERS, GETUSERSFORSEARCH, GETUSER, UPDATEUSER } = UsersQuery()
    const { CHECKUSERINSTANCE } = AuthQuery()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const { validateUserUpdate } = UserValidations()
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
    const UpdateUserInformation = async (res, user, id, firstname, lastname, email, phone, usertype) => {
        const timestamp = (new Date()).toISOString()
        try {
            await pool.query(UPDATEUSER, [firstname, lastname, email, phone, usertype, timestamp, id])
            return res.status(200).json({
                message: 'Successful user update', code: '200', data: {
                    ...user,
                    firstname,
                    lastname,
                    email,
                    phone,
                    usertype,
                    updated_at: timestamp
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const updateUser = async (req, res) => {
        let { id, firstname, lastname, email, phone, usertype } = req.body
        const expected_payload = ['id', 'firstname', 'lastname', 'email', 'phone', 'usertype']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })

        const validate = validateUserUpdate(req.body, async () => {
            firstname = cleanSCW(firstname)
            lastname = cleanSCW(lastname)
            email = email.trim()
            phone = cleanExcessWhiteSpaces(phone)
            usertype = Number(usertype)
            try {
                const userData = await pool.query(GETUSER, [id])
                if (userData.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const user = userData.rows[0]
                const checkUserInstance = await pool.query(CHECKUSERINSTANCE, [email, phone])
                if (checkUserInstance.rowCount === 0) return UpdateUserInformation(res, user, id, firstname, lastname, email, phone, usertype)
                const isNotOwned = checkUserInstance.rows.some(item => item.id !== id)
                if (isNotOwned) return res.status(412).json({ message: 'Email address or phone number has been taken', code: '412', data: {} })
                return UpdateUserInformation(res, user, id, firstname, lastname, email, phone, usertype)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: WSWW, code: '412', data: {} })
    }

    return {
        getUsers, searchUsers, updateUser
    }
}