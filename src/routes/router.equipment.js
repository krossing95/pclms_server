import express from "express"
import AdminMiddleware from "../middlewares/middleware.admin.js"
import EquipmentController from "../controllers/equipment/controller.equipment.js"
import EquipmentCommentController from "../controllers/equipment/controller.comment.js"
import UserMiddleware from "../middlewares/middleware.user.js"
import HiddenEquipmentControllers from "../controllers/equipment/controller.hidden.js"

const equipmentRouter = express.Router()

const equipmentControllers = EquipmentController()
const commentControllers = EquipmentCommentController()
const hiddenEquipmentControllers = HiddenEquipmentControllers()

equipmentRouter.get('/', equipmentControllers.getEquipment)
equipmentRouter.get('/search', equipmentControllers.searchEquipment)
equipmentRouter.get('/filter', equipmentControllers.filterEquipment)
equipmentRouter.get('/single', equipmentControllers.getOneEquipment)
equipmentRouter.post('/', AdminMiddleware, equipmentControllers.createEquipment)
equipmentRouter.patch('/file-upload', AdminMiddleware, equipmentControllers.equipmentFileUpload)
equipmentRouter.patch('/', AdminMiddleware, equipmentControllers.updateEquipment)
equipmentRouter.delete('/', AdminMiddleware, equipmentControllers.removeEquipment)

// Comments
equipmentRouter.post('/comments', UserMiddleware, commentControllers.postComment)
equipmentRouter.patch('/comments', UserMiddleware, commentControllers.updateComment)
equipmentRouter.delete('/comments', UserMiddleware, commentControllers.deleteComment)
equipmentRouter.get('/comments', commentControllers.getComments)

// Saves
equipmentRouter.post('/save', UserMiddleware, equipmentControllers.saveEquipmentAsFavorite)

// Recycle bin
equipmentRouter.get('/hidden', hiddenEquipmentControllers.getHiddenEquipment)
equipmentRouter.get('/hidden/search', hiddenEquipmentControllers.searchHiddenEquipment)
equipmentRouter.patch('/hidden', AdminMiddleware, hiddenEquipmentControllers.retrieveHiddenEquipment)
export default equipmentRouter