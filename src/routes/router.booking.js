import express from "express"
import UserMiddleware from "../middlewares/middleware.user.js"
import BookingController from "../controllers/bookings/controller.booking.js"

const bookingRoute = express.Router()

const bookingMethods = BookingController()

bookingRoute.get('/requirements', UserMiddleware, bookingMethods.getRequirements)

export default bookingRoute