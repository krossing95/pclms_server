import express from "express"
import AdminMiddleware from "../middlewares/middleware.admin.js"
import EquipmentController from "../controllers/equipment/controller.equipment.js"

const equipmentRouter = express.Router()

const { getEquipment, createEquipment, searchEquipment, filterEquipment, getOneEquipment, equipmentFileUpload, updateEquipment } = EquipmentController()

equipmentRouter.get('/', getEquipment)
equipmentRouter.get('/search', searchEquipment)
equipmentRouter.get('/filter', filterEquipment)
equipmentRouter.get('/single', getOneEquipment)
equipmentRouter.post('/', AdminMiddleware, createEquipment)
equipmentRouter.patch('/file-upload', AdminMiddleware, equipmentFileUpload)
equipmentRouter.patch('/', AdminMiddleware, updateEquipment)

export default equipmentRouter