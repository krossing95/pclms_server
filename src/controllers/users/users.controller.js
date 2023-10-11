import DatabaseConnection from "../../config/config.db.js"
import Pagination from "../../helpers/helper.pagination.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import UsersQuery from "../../queries/query.users.js"
import url from "url"
import UserValidations from "../../validators/users/validate.users.js"
import AuthQuery from "../../queries/query.auth.js"
import { Regex } from "../../utils/static/index.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import { compareSync, genSaltSync, hashSync } from "bcrypt"

export default function UsersController() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const { PAGINATE_USERS, GETUSERSFORSEARCH, GETUSER, GETPASSWORD, UPDATEPASSWORD, UPDATEUSER, CHECKUSERRELATIONS, DELETEUSER, CLEARCREDENTIALS } = UsersQuery()
    const { CHECKUSERINSTANCE } = AuthQuery()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const { validateUserUpdate, validatePasswordUpdate } = UserValidations()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const { MONGOOBJECT } = Regex
    const SALT = genSaltSync(10)

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
                if (!user.is_verified && usertype === process.env.LMS_ADMIN) return res.status(412).json({ message: 'Cannot assign administrative roles to user', code: '412', data: {} })
                const checkUserInstance = await pool.query(CHECKUSERINSTANCE, [email, phone])
                if (checkUserInstance.rowCount === 0) return UpdateUserInformation(res, user, id, firstname, lastname, email, phone, usertype)
                const isNotOwned = checkUserInstance.rows.some(item => item.id !== id)
                if (isNotOwned) return res.status(412).json({ message: 'Email address or phone number has been taken', code: '412', data: {} })
                return UpdateUserInformation(res, user, id, firstname, lastname, email, phone, usertype)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }
    const DeleteUser = async (req, res, id) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
        try {
            await pool.query(DELETEUSER, [id])
            const paginationData = await GetPageParams(pageSize, 'users', `is_deleted = false`)
            const collection = await pool.query(PAGINATE_USERS, [false, pageSize, offset])
            return res.status(200).json({
                message: 'User records deleted successfully', code: '200', data: {
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
    const removeUser = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('id')) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        const id = params.get('id')
        if (!id.match(MONGOOBJECT)) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        try {
            const checkUser = await pool.query(GETUSER, [id])
            if (checkUser.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const checkRelationships = await pool.query(CHECKUSERRELATIONS, [id])
            const count = checkRelationships.rows[0]
            if (Number(count.equipments_registered_by_user) === 0 && Number(count.bookings_marked_by_user) === 0) return DeleteUser(req, res, id)
            const anonyms = ''
            await pool.query(CLEARCREDENTIALS, [anonyms, true, id])
            const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
            const paginationData = await GetPageParams(pageSize, 'users', `is_deleted = false`)
            const collection = await pool.query(PAGINATE_USERS, [false, pageSize, offset])
            return res.status(200).json({
                message: 'User records moved to recycle bin', code: '200', data: {
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
    // User profile
    const getAuthedUser = async (req, res) => {
        const request_sender = RequestInformation(req, res)
        if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
        const userId = request_sender.user_id
        try {
            const getUser = await pool.query(GETUSER, [userId])
            if (getUser.rowCount === 0) return res.status(412).json({ message: 'No user records found', code: '412', data: {} })
            return res.status(200).json({ message: '', code: '200', data: { ...getUser.rows[0], row_id: undefined } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const updateAuthedUser = async (req, res) => {
        let { firstname, lastname, email, phone } = req.body
        const request_sender = RequestInformation(req, res)
        if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
        const userId = request_sender.user_id
        req.body = { ...req.body, id: userId, usertype: 1 }
        const validate = validateUserUpdate(req.body, async () => {
            try {
                firstname = cleanSCW(firstname)
                lastname = cleanSCW(lastname)
                email = email.trim()
                phone = cleanExcessWhiteSpaces(phone)
                const getUser = await pool.query(GETUSER, [userId])
                if (getUser.rowCount === 0) return res.status(412).json({ message: 'User account not found', code: '412', data: {} })
                const data = getUser.rows[0]
                if (firstname === data.firstname &&
                    lastname === data.lastname &&
                    email === data.email &&
                    phone === data.phone) return res.status(412).json({ message: 'No changes found', code: '412', data: {} })
                const getDataInstance = await pool.query(CHECKUSERINSTANCE, [email, phone])
                if (getDataInstance.rowCount === 0) return UpdateUserInformation(res, data, userId, firstname, lastname, email, phone, data.usertype)
                const isNotOwned = getDataInstance.rows.some(item => item.id !== userId)
                if (isNotOwned) return res.status(412).json({ message: 'Email address or phone number has been taken', code: '412', data: {} })
                return UpdateUserInformation(res, data, userId, firstname, lastname, email, phone, data.usertype)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    const passwordUpdate = async (req, res) => {
        let { old_password, new_password, confirm_password } = req.body
        const request_sender = RequestInformation(req, res)
        if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
        const userId = request_sender.user_id
        const validate = validatePasswordUpdate(req.body, async () => {
            try {
                const getDBPassword = await pool.query(GETPASSWORD, [userId])
                if (getDBPassword.rowCount === 0) return res.status(412).json({ message: 'User account not found', code: '412', data: {} })
                const password = getDBPassword.rows[0].password
                const oldPasswordMatched = compareSync(old_password, password)
                if (!oldPasswordMatched) return res.status(412).json({ message: 'Old password is not correct', code: '412', data: {} })
                const hashedNewPassword = hashSync(new_password, SALT)
                await pool.query(UPDATEPASSWORD, [hashedNewPassword, userId])
                return res.status(200).json({ message: 'Password update was successful', code: '200', data: {} })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    return {
        getUsers, searchUsers, updateUser, removeUser, getAuthedUser, updateAuthedUser, passwordUpdate
    }
}