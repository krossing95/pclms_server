import DatabaseConnection from "../../config/config.db.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { ObjectId } from "bson"
import Pagination from "../../helpers/helper.pagination.js"
import moment from "moment"
import needle from "needle"
import StringManipulators from "../../helpers/helper.string_methods.js"

export default function BookingControllers() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const bookingQueries = BookingsQuery()
    const validations = BookingsValidations()
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const requirementsPerPage = 10
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const string_methods = StringManipulators()

    const getRequirements = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id')) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        const equipment_id = params.get('equipment_id')
        if (!equipment_id.match(regex.MONGOOBJECT)) return res.status(412).json({ message: 'Bad request', code: '412', data: {} })
        try {
            const blockedDays = (await pool.query(bookingQueries.GETBLOCKEDDAYS)).rows
            let bookedDays = (await pool.query(bookingQueries.GETBOOKEDDAYS, [equipment_id, 3])).rows
            const { pageSize, page } = Setter(params, 1, requirementsPerPage)
            const paginationData = LocalPaginator(blockedDays, requirementsPerPage, page)
            if (bookedDays.length === 0) return res.status(200).json({
                message: '', code: '200', data: {
                    day_set: [...blockedDays],
                    unavailable_days: [...paginationData.list],
                    page_data: {
                        totalCount: paginationData.totalCount,
                        totalPages: paginationData.totalPages,
                        currentPage: page,
                        pageSize
                    }
                }
            })
            const slotSums = new Map()
            bookedDays.forEach(({ date, slots }) => {
                const currentSum = slotSums.get(date) || 0
                slotSums.set(date, currentSum + slots.length)
            })
            let freeDays = bookedDays.filter(({ date, slots }) => {
                const sum = slotSums.get(date)
                return sum === 18 || slots.length === 18
            })
            freeDays = [...new Map(freeDays.map(item => [item.date, item])).values()]
            freeDays = freeDays.map(day => {
                return { ...day, name: 'Booked', slots: undefined }
            })
            const newPaginationData = LocalPaginator([...freeDays, ...blockedDays], requirementsPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    unavailable_days: [...newPaginationData.list],
                    day_set: [...freeDays, ...blockedDays],
                    page_data: {
                        totalCount: newPaginationData.totalCount,
                        totalPages: newPaginationData.totalPages,
                        currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const getSlots = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id') || !params.get('date')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const equipment_id = params.get('equipment_id')
        const date = params.get('date')
        const validate = validations.validateSlotRequest({ equipment_id, date }, async () => {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            try {
                const getData = await pool.query(bookingQueries.GETSLOTSDATA, [equipment_id, date, 3])
                if (getData.rowCount === 0) return res.status(200).json({
                    message: '', code: '200', data: {
                        unavailable_slots: []
                    }
                })
                const slotsWithoutUser = getData.rows.filter(slot => slot.user_id !== userId)
                let slots = []
                for (let i = 0; i < slotsWithoutUser.length; i++) {
                    const row = slotsWithoutUser[i]
                    slots = [...slots, ...row.slots]
                }
                return res.status(200).json({
                    message: '', code: '200', data: {
                        unavailable_slots: [...slots]
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const EquipmentBooking = async (res, userId, equipment_id, date, need_assist, slots) => {
        try {
            const id = (new ObjectId()).toString()
            const timestamp = (new Date()).toISOString()
            await pool.query(bookingQueries.CREATEBOOKING, [id, userId, equipment_id, date, need_assist, slots, timestamp])
            await pool.query(bookingQueries.CANCELPASTBOOKINGS, [3])
            return res.status(201).json({
                message: 'Successful booking', code: '201', data: {
                    date,
                    need_assist,
                    slots
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const bookEquipment = async (req, res) => {
        let { equipment_id, date, need_assist, slots } = req.body
        const expected_payload = ['equipment_id', 'date', 'need_assist', 'slots']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validations.validateBooking(req.body, async () => {
            try {
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
                const userId = request_sender.user_id
                const checkEquipment = await pool.query(bookingQueries.CHECKEQUIPMENT, [false, equipment_id])
                if (checkEquipment.rowCount !== 1) return res.status(412).json({ message: 'Equipment does not exists', code: '412', data: {} })
                const equipmentData = checkEquipment.rows[0]
                if (!equipmentData.functionality_status || !equipmentData.availability_status) return res.status(412).json({ message: 'Equipment is currently not available', code: '412', data: {} })
                // Check if user has booked this equipment already
                const openedBookings = await pool.query(bookingQueries.REQUIREOPENEDBOOKINGHISTORY, [equipment_id, userId, 3])
                const { user_has_opened_booking, total_opened_bookings } = openedBookings.rows[0]
                if (parseInt(user_has_opened_booking) > 0) return res.status(412).json({ message: 'You already have an opened reservation on this equipment', code: '412', data: {} })
                if (parseInt(total_opened_bookings) === 3) return res.status(412).json({ message: 'You have three opened bookings existing already', code: '412', data: {} })
                // Check unavailable slots
                const getUnavailableSlots = await pool.query(bookingQueries.GETSLOTSDATA, [equipment_id, date, 3])
                if (getUnavailableSlots.rowCount === 0) return EquipmentBooking(res, userId, equipment_id, date, need_assist, slots)
                let unavailable_slots = []
                for (let i = 0; i < getUnavailableSlots.rows.length; i++) {
                    const row = getUnavailableSlots.rows[i]
                    unavailable_slots = [...unavailable_slots, ...row.slots]
                }
                if (unavailable_slots.length === 0) return EquipmentBooking(res, userId, equipment_id, date, need_assist, slots)
                // Check if the bookable slots are part of the unavailable ones
                const checkDisparity = slots.every(slot => unavailable_slots.includes(slot))
                if (checkDisparity) return res.status(412).json({ message: 'Some selected slots are not available', code: '412', data: {} })
                return EquipmentBooking(res, userId, equipment_id, date, need_assist, slots)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const getBookingList = async (usertype, userId) => {
        try {
            let returnedData = []
            const get_bookings = await pool.query(bookingQueries.PAGINATE_BOOKINGS, [false])
            let bookinglist = get_bookings.rows
            if (bookinglist.length === 0) return returnedData
            bookinglist = usertype === Number(process.env.LMS_ADMIN) ? [...bookinglist] : usertype === Number(process.env.LMS_USER) ? [...bookinglist].filter(row => row.user_id === userId) : []
            if (bookinglist.length === 0) return returnedData
            const pastBookingIds = bookinglist.filter(booking => (moment(booking.date).isBefore(moment(new Date())) && booking.status < 3)).map(booking => booking.id)
            if (pastBookingIds.length > 0) {
                for (let i = 0; i < pastBookingIds.length; i++) {
                    const id = pastBookingIds[i]
                    const cancelQuery = `UPDATE bookings SET status = $1 WHERE id = $2`
                    await pool.query(cancelQuery, [3, id])
                }
            }
            const dataToPaginate = bookinglist.map(booking => {
                if (pastBookingIds.includes(booking.id)) {
                    return { ...booking, status: 3 }
                }
                return booking
            })
            return dataToPaginate
        } finally {
            console.log(true)
        }
    }

    const getBookings = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const emptyDataStructure = {
            bookings: [],
            page_data: {
                totalCount: 0,
                totalPages: 0,
                currentPage: page, pageSize
            }
        }
        try {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id') ||
                !Object.keys(request_sender).includes('usertype')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            const usertype = request_sender.usertype
            const booking_list = await getBookingList(usertype, userId)
            if (booking_list.length === 0) return res.status(200).json({
                message: '', code: '200', data: {
                    ...emptyDataStructure
                }
            })
            const paginatedData = LocalPaginator([...booking_list], resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    bookings: [...paginatedData.list],
                    page_data: {
                        totalCount: paginatedData.totalCount,
                        totalPages: paginatedData.totalPages,
                        currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const getSingleBooking = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('booking_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const booking_id = params.get('booking_id')
        if (!booking_id.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const getBooking = await pool.query(bookingQueries.GETBOOKING, [false, booking_id])
            if (getBooking.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getBooking.rows[0]
            const date = data.date
            if (moment(date).isBefore(moment(new Date())) && data.status < 3) {
                const status = 3
                await pool.query(bookingQueries.CANCELBOOKING, [status, booking_id])
                data.status = status
            }
            return res.status(200).json({ message: '', code: '200', data: { ...data } })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const RemoveBooking = async (res, booking_id) => {
        try {
            await pool.query(bookingQueries.REMOVEBOOKING, [booking_id])
            return res.status(200).json({
                message: 'Record removed successfully', code: '200',
                data: {}
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const removeBooking = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('booking_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const booking_id = params.get('booking_id')
        if (!booking_id.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id') ||
                !Object.keys(request_sender).includes('usertype')) return res.status(412).json({ message: 'Authentication is required', code: '412', data: {} })
            const userId = request_sender.user_id
            const usertype = request_sender.usertype
            const getBooking = await pool.query(bookingQueries.GETBOOKING, [false, booking_id])
            if (getBooking.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getBooking.rows[0]
            if (usertype === Number(process.env.LMS_ADMIN)) return RemoveBooking(res, booking_id)
            if (data.user_id !== userId) return res.status(412).json({ message: 'Access denied', code: '412', data: {} })
            return RemoveBooking(res, booking_id)
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const UpdateBooking = async (res, data, booking_id, date, need_assist, slots) => {
        try {
            const timestamp = (new Date()).toISOString()
            const status = 1
            const update_count = data.update_count + 1
            await pool.query(bookingQueries.UPDATEBOOKING, [date, status, need_assist, slots, timestamp, update_count, booking_id])
            const getAdmins = await pool.query(bookingQueries.GETADMINCONTACTS, [2])
            if (getAdmins.rowCount === 0) return res.status(200).json({
                message: 'Record was updated successfully', code: '200', data: {
                    ...data,
                    date,
                    need_assist,
                    slots,
                    update_count,
                    updated_at: timestamp,
                    functionality_status: undefined,
                    availability_status: undefined
                }
            })
            const contacts = getAdmins.rows.map(row => `233${parseInt(row.phone)}}`)
            await needle(
                "post", process.env.LMS_MESSENGER_URL,
                {
                    "sender": process.env.LMS_MESSENGER_NAME,
                    "message": `Hello admin, there are pending bookings, waiting for approval`,
                    "recipients": [...contacts]
                },
                {
                    headers: {
                        'api-key': process.env.LMS_MESSENGER_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            )
            return res.status(200).json({
                message: 'Record was updated successfully', code: '200', data: {
                    ...data,
                    date,
                    need_assist,
                    slots,
                    updated_at: timestamp,
                    functionality_status: undefined,
                    availability_status: undefined
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const updateBooking = async (req, res) => {
        let { booking_id, date, need_assist, slots } = req.body
        const expected_payload = ['booking_id', 'date', 'need_assist', 'slots']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        req.body = { ...req.body, equipment_id: booking_id }
        const validate = validations.validateBooking(req.body, async () => {
            try {
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
                const userId = request_sender.user_id
                const getBooking = await pool.query(bookingQueries.GETBOOKINGFORUPDATE, [false, booking_id])
                if (getBooking.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const data = getBooking.rows[0]
                if (data.user_id !== userId) return res.status(412).json({ message: 'Access denied', code: '412', data: {} })
                if (data.update_count === 3) {
                    await pool.query(bookingQueries.CANCELBOOKING, [3, booking_id])
                    return res.status(412).json({ message: 'Booking was closed due to too many updates on the record', code: '412', data: {} })
                }
                // if (data.status === 3) return res.status(412).json({ message: 'Cannot update a closed booking', code: '412', data: {} })
                if (moment(data.date).isBefore(moment(new Date()))) {
                    await pool.query(bookingQueries.CANCELBOOKING, [3, booking_id])
                    return res.status(412).json({ message: 'The scheduled appointment date has elapsed, resulting in automatic closure of the booking', code: '412', data: {} })
                }
                if (!data.functionality_status || !data.availability_status) return res.status(412).json({ message: 'The equipment is currently not accessible for booking', code: '412', data: {} })
                const getUnavailableSlots = await pool.query(bookingQueries.GETSLOTSDATA, [data.equipment_id, date, 3])
                if (getUnavailableSlots.rowCount === 0) return UpdateBooking(res, data, booking_id, date, need_assist, slots)
                const slotsWithoutUser = getUnavailableSlots.rows.filter(slot => slot.user_id !== userId)
                let unavailable_slots = []
                for (let i = 0; i < slotsWithoutUser.length; i++) {
                    const row = slotsWithoutUser[i]
                    unavailable_slots = [...unavailable_slots, ...row.slots]
                }
                if (unavailable_slots.length === 0) return UpdateBooking(res, data, booking_id, date, need_assist, slots)
                const checkDisparity = slots.every(slot => unavailable_slots.includes(slot))
                if (checkDisparity) return res.status(412).json({ message: 'Some selected slots are not available', code: '412', data: {} })
                return UpdateBooking(res, data, booking_id, date, need_assist, slots)
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    const searchBookings = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            bookings: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        if (!params.get('q')) return res.status(200).json({ message: 'Search query is missing', code: '200', data: { ...structure } })
        const q = string_methods.cleanExcessWhiteSpaces(params.get('q')).toLowerCase()
        try {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id') ||
                !Object.keys(request_sender).includes('usertype')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            const usertype = request_sender.usertype
            const booking_list = await getBookingList(usertype, userId)
            const matches = booking_list.filter(item => JSON.stringify(item).toLowerCase().includes(q))
            const paginatedData = LocalPaginator([...matches], resultPerPage, page)
            return res.status(200).json({
                message: '', code: '200', data: {
                    bookings: [...paginatedData.list],
                    page_data: {
                        totalCount: paginatedData.totalCount,
                        totalPages: paginatedData.totalPages,
                        currentPage: page, pageSize
                    },
                    data_type: paginatedData.totalPages > 1 ? 'search' : ''
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    const filterBookings = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, page } = Setter(params, 1, resultPerPage)
        const structure = {
            bookings: [],
            page_data: {
                totalPages: 0, totalCount: 0, currentPage: page, pageSize
            },
            data_type: ''
        }
        if (!params.get('from') || !params.get('to')) return res.status(200).json({ message: '', code: '200', data: { ...structure } })
        const from = params.get('from')
        const to = params.get('to')
        const status = !params.get('status') ? '' : params.get('status')
        const validate = validations.validateBookingFilter({ from, to, status }, async () => {
            try {
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id') ||
                    !Object.keys(request_sender).includes('usertype')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
                const userId = request_sender.user_id
                const usertype = request_sender.usertype
                const booking_list = await getBookingList(usertype, userId)
                if (booking_list.length === 0) return res.status(200).json({ message: '', code: '200', data: { ...structure } })
                const newFrom = moment(from).subtract(1, "days").format("YYYY-MM-DD")
                const newTo = moment(to).add(1, "days").format("YYYY-MM-DD")
                let filtered_data = booking_list.filter(row => moment(row.date).isBetween(newFrom, newTo))
                if ([1, 2, 3].includes(Number(status))) {
                    filtered_data = filtered_data.filter(row => row.status === Number(status))
                }
                const paginatedData = LocalPaginator([...filtered_data], resultPerPage, page)
                return res.status(200).json({
                    message: '', code: '200', data: {
                        bookings: [...paginatedData.list],
                        page_data: {
                            totalCount: paginatedData.totalCount,
                            totalPages: paginatedData.totalPages,
                            currentPage: page, pageSize
                        },
                        data_type: paginatedData.totalPages > 1 ? 'filter' : ''
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    const assignStatus = async (req, res) => {
        let { id, status } = req.body
        const expected_payload = ['id', 'status']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validations.validateStatusAssignment(req.body, async () => {
            try {
                const getBooking = await pool.query(bookingQueries.GETBOOKINGFORUPDATE, [false, id])
                if (getBooking.rowCount !== 1) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
                const data = getBooking.rows[0]
                // if (data.status === 3) return res.status(412).json({ message: 'Cannot update a closed booking', code: '412', data: {} })
                if (moment(data.date).isBefore(moment(new Date()))) {
                    await pool.query(bookingQueries.CANCELBOOKING, [3, booking_id])
                    return res.status(412).json({ message: 'Cannot assign a status to a booking that is overdue', code: '412', data: {} })
                }
                if (status === data.status) return res.status(412).json({ message: 'No changes found yet', code: '412', data: {} })
                if (!data.functionality_status || !data.availability_status) return res.status(412).json({ message: 'The equipment is currently not accessible', code: '412', data: {} })
                const timestamp = (new Date()).toISOString()
                await pool.query(bookingQueries.ASSIGNSTATUS, [status, timestamp, id])
                await needle(
                    "post", process.env.LMS_MESSENGER_URL,
                    {
                        "sender": process.env.LMS_MESSENGER_NAME,
                        "message": `Hi ${data.lastname}, We are glad to notify you that the appointment you scheduled to use our ${data.name} on ${moment((new Date(data.date)).toISOString()).format('ll')} at the following time intervals; ${data.slots.map(t => t)} has been ${status === 1 ? 'made pending due to unforeseen conditions beyond our control. We are therefore sorry for any inconvenience caused you. You may please contact us for more information.' : status === 2 ? 'approved by management. Management will be so glad if you are present before the scheduled time slots. You may please contact us for more information.' : status === 3 ? 'closed or cancelled due to circumstances beyond our control. We are deeply sorry for any inconvenience caused. Kindly contact us for more details.' : '...'}`,
                        "recipients": [`233${data.phone}`]
                    },
                    {
                        headers: {
                            'api-key': process.env.LMS_MESSENGER_API_KEY,
                            'Content-Type': 'application/json'
                        }
                    }
                )
                return res.status(200).json({ message: 'Status assignment was successful', code: '200', data: {} })
            } catch (error) {
                console.log(error);
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
    }

    return {
        getRequirements, getSlots, bookEquipment, getBookings, getSingleBooking,
        removeBooking, updateBooking, searchBookings, filterBookings, assignStatus
    }
}