import express from 'express'
import BookingControllers from '../controllers/bookings/controller.booking.js'
import UserMiddleware from '../middlewares/middleware.user.js'

const bookingRouter = express.Router()

const bookingsControllers = BookingControllers()

bookingRouter.get('/requirements', UserMiddleware, bookingsControllers.getRequirements)

export default bookingRouter