import DatabaseConnection from "../../config/config.db.js"
import Pagination from "../../helpers/helper.pagination.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import HiddenBookingsQuery from "../../queries/query.hidden_bookings.js"
import { Regex } from "../../utils/static/index.js"
import moment from "moment"
import url from "url"

export default function HiddenBookingsControllers() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const { LocalPaginator, Setter, GetPageParams } = Pagination()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const string_methods = StringManipulators()
    const bookingQueries = HiddenBookingsQuery()

    const getBookingList = async () => {
        try {
            let returnedData = []
            const get_bookings = await pool.query(bookingQueries.PAGINATE_BOOKINGS)
            let bookinglist = get_bookings.rows
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

    const getHiddenBookings = async (req, res) => {
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
            const booking_list = await getBookingList()
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

    const removeBooking = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('id')) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const id = params.get('id')
        if (!id.match(regex.MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        try {
            await pool.query(bookingQueries.REMOVEBOOKING, [id])
            const { pageSize, page } = Setter(params, 1, resultPerPage)
            const data = await getBookingList()
            if (data.length === 0) return res.status(200).json({
                message: 'Record was permanently removed', code: '200', data: {
                    bookings: [],
                    page_data: {
                        totalCount: 0,
                        totalPages: 0,
                        currentPage: page, pageSize
                    }
                }
            })
            const paginatedData = LocalPaginator([...data], resultPerPage, page)
            return res.status(200).json({
                message: 'Record was permanently removed', code: '200', data: {
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

    const searchHiddenBookings = async (req, res) => {
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
            const booking_list = await getBookingList()
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

    return {
        getHiddenBookings, removeBooking, searchHiddenBookings
    }
}