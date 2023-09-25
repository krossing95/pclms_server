import express from "express"
import UserMiddleware from "../middlewares/middleware.user.js"
import EquipmentBookingControllers from "../controllers/equipment_booking/controller.equipment_booking.js"

const bookingRoute = express.Router()

const controllers = EquipmentBookingControllers()

bookingRoute.get('/requirements', UserMiddleware, controllers.getBookingRequirements)

export default bookingRoute
