import DatabaseConnection from "../../config/config.db.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import { ObjectId } from "bson"
import Pagination from "../../helpers/helper.pagination.js"

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
                const usersSlotExists = getData.rows.some(row => row.user_id === userId)
                if (usersSlotExists) return res.status(412).json({ message: 'You have already booked for the equipment on the selected date', code: '412', data: {} })
                let slots = []
                for (let i = 0; i < getData.rows.length; i++) {
                    const row = getData.rows[i]
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
                for (let i = 0; i < getData.rows.length; i++) {
                    const row = getData.rows[i]
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
            const paginatedData = LocalPaginator([...bookings], resultPerPage, page)
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

    return {
        getRequirements, getSlots, bookEquipment, getBookings
    }
}