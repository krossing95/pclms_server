import express from "express"
import UserMiddleware from "../middlewares/middleware.user.js"
import BookingController from "../controllers/bookings/controller.booking.js"

const bookingRoute = express.Router()

const bookingMethods = BookingController()

bookingRoute.get('/requirements', UserMiddleware, bookingMethods.getRequirements)
bookingRoute.get('/slots', UserMiddleware, bookingMethods.getSlots)
bookingRoute.post('/', UserMiddleware, bookingMethods.bookEquipment)
bookingRoute.get('/', UserMiddleware, bookingMethods.getBookings)
bookingRoute.get('/single', UserMiddleware, bookingMethods.getSingleBooking)
bookingRoute.delete('/', UserMiddleware, bookingMethods.removeBooking)
bookingRoute.patch('/', UserMiddleware, bookingMethods.updateBooking)

export default bookingRoute