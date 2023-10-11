import express from "express"
import UserMiddleware from "../middlewares/middleware.user.js"
import BookingController from "../controllers/bookings/controller.booking.js"
import AdminMiddleware from "../middlewares/middleware.admin.js"
import HiddenBookingsControllers from "../controllers/bookings/controller.hidden_booking.js"
import DatabaseConnection from "../config/config.db.js"

const bookingRoute = express.Router()
const { pool } = DatabaseConnection()

const bookingMethods = BookingController()
const hiddenBookingsControllers = HiddenBookingsControllers()

bookingRoute.get('/requirements', UserMiddleware, bookingMethods.getRequirements)
bookingRoute.get('/slots', UserMiddleware, bookingMethods.getSlots)
bookingRoute.post('/', UserMiddleware, bookingMethods.bookEquipment)
bookingRoute.get('/', UserMiddleware, bookingMethods.getBookings)
bookingRoute.get('/single', bookingMethods.getSingleBooking)
bookingRoute.delete('/', UserMiddleware, bookingMethods.removeBooking)
bookingRoute.patch('/', UserMiddleware, bookingMethods.updateBooking)
bookingRoute.get('/search', UserMiddleware, bookingMethods.searchBookings)
bookingRoute.get('/filter', UserMiddleware, bookingMethods.filterBookings)
bookingRoute.patch('/assign_status', AdminMiddleware, bookingMethods.assignStatus)
bookingRoute.patch('/mark', AdminMiddleware, bookingMethods.markAttendance)

// Recycle bin

bookingRoute.get('/hidden', hiddenBookingsControllers.getHiddenBookings)
bookingRoute.get('/hidden/search', hiddenBookingsControllers.searchHiddenBookings)
bookingRoute.delete('/hidden', AdminMiddleware, hiddenBookingsControllers.removeBooking)

export default bookingRoute