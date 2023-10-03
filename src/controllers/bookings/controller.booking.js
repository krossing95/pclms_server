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
import format from "pg-format"
import needle from "needle"

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

    const getBookings = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
        try {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            const get_bookings = await pool.query(bookingQueries.PAGINATE_BOOKINGS, [false, userId])
            const bookings = get_bookings.rows
            const pastBookingIds = bookings.filter(booking => (moment(booking.date).isBefore(moment(new Date())) && booking.status < 3)).map(booking => booking.id)
            if (pastBookingIds.length > 0) {
                for (let i = 0; i < pastBookingIds.length; i++) {
                    const id = pastBookingIds[i]
                    const cancelQuery = `UPDATE bookings SET status = $1 WHERE id = $2`
                    await pool.query(cancelQuery, [3, id])
                }
            }
            const dataToPaginate = bookings.map(booking => {
                if (pastBookingIds.includes(booking.id)) {
                    return { ...booking, status: 3 }
                }
                return booking
            })
            const paginatedData = LocalPaginator([...dataToPaginate], resultPerPage, page)
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
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(401).json({ message: 'Authentication is required', code: '401', data: {} })
            const userId = request_sender.user_id
            const getBooking = await pool.query(bookingQueries.GETBOOKING, [false, booking_id])
            if (getBooking.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getBooking.rows[0]
            if (data.user_id !== userId) return res.status(412).json({ message: 'Access denied!', code: '412', data: {} })
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

    const removeBooking = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('booking_id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const booking_id = params.get('booking_id')
        if (!booking_id.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            const request_sender = RequestInformation(req, res)
            if (!Object.keys(request_sender).includes('user_id')) return res.status(412).json({ message: 'Authentication is required', code: '412', data: {} })
            const userId = request_sender.user_id
            const getBooking = await pool.query(bookingQueries.GETBOOKING, [false, booking_id])
            if (getBooking.rowCount === 0) return res.status(412).json({ message: 'No records found', code: '412', data: {} })
            const data = getBooking.rows[0]
            if (data.user_id !== userId) return res.status(412).json({ message: 'Access denied', code: '412', data: {} })
            await pool.query(bookingQueries.REMOVEBOOKING, [booking_id])
            return res.status(200).json({ message: 'Record removed successfully', code: '200', data: {} })
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
                    "message": ``,
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
                if (data.update_count > 3) {
                    await pool.query(bookingQueries.CANCELBOOKING, [3, booking_id])
                    return res.status(412).json({ message: 'Booking was closed due to too many updates on the record', code: '412', data: {} })
                }
                if (data.status === 3) return res.status(412).json({ message: 'Cannot update a closed booking', code: '412', data: {} })
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

    return {
        getRequirements, getSlots, bookEquipment, getBookings, getSingleBooking,
        removeBooking, updateBooking
    }
}