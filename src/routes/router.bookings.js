import express from 'express'
import UserMiddleware from '../middlewares/middleware.user.js'
import BookingControllers from '../controllers/bookings/controller.bookings.js'

const bookingRouter = express.Router()

const bookingsControllers = BookingControllers()

bookingRouter.get('/requirements', UserMiddleware, bookingsControllers.getBookingRequirements)
bookingRouter.get('/slots', UserMiddleware, bookingsControllers.getBookingSlots)
bookingRouter.post('/', UserMiddleware, bookingsControllers.bookEquipment)

export default bookingRouter