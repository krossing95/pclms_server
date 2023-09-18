import express from "express"
import DashboardController from "../controllers/dashboard/controller.dashboard.js"
import UserMiddleware from "../middlewares/middleware.user.js"

const dashboardRoute = express.Router()

const dashboardMethods = DashboardController()

dashboardRoute.get('/', UserMiddleware, dashboardMethods.fetchData)

export default dashboardRoute