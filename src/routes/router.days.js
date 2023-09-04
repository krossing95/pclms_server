import express from "express"
import ConfigureDays from "../controllers/days_management/config.manage_days.js"
import AdminMiddleware from "../middlewares/middleware.admin.js"

const daysRouter = express.Router()

const { createDay, getDays, updateDay, deleteDay } = ConfigureDays()

daysRouter.post('/', AdminMiddleware, createDay)
daysRouter.patch('/', AdminMiddleware, updateDay)
daysRouter.delete('/', AdminMiddleware, deleteDay)
daysRouter.get('/', getDays)

export default daysRouter