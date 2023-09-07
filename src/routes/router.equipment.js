import express from "express"
import AdminMiddleware from "../middlewares/middleware.admin.js"
import EquipmentController from "../controllers/equipment/controller.equipment.js"

const equipmentRouter = express.Router()

const { getEquipment, createEquipment, searchEquipment, filterEquipment } = EquipmentController()

equipmentRouter.get('/', getEquipment)
equipmentRouter.get('/search', searchEquipment)
equipmentRouter.get('/filter', filterEquipment)
equipmentRouter.post('/', AdminMiddleware, createEquipment)

export default equipmentRouter