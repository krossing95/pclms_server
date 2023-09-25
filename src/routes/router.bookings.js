import express from 'express'
import UserMiddleware from '../middlewares/middleware.user.js'
import EquipmentBookingController from '../controllers/bookings/controller.equipment_booking.js'

const bookingRouter = express.Router()

const bookingControllers = EquipmentBookingController()

bookingRouter.get('/requirements', UserMiddleware, bookingControllers.requestBookingRequirements)

export default bookingRouter