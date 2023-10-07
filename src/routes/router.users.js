import express from 'express'
import AuthController from '../controllers/auth/controller.auth.js'
import UsersController from '../controllers/users/users.controller.js'
import AdminMiddleware from "../middlewares/middleware.admin.js"
import UserMiddleware from "../middlewares/middleware.user.js"

const usersRoute = express.Router()

const authControllers = AuthController()
const userControllers = UsersController()

usersRoute.post('/auth', authControllers.register)
usersRoute.post('/auth/login', authControllers.login)
usersRoute.post('/auth/verify', authControllers.verification)
usersRoute.post('/auth/resend_otp', authControllers.resendOTP)
usersRoute.get('/', userControllers.getUsers)
usersRoute.get('/search', userControllers.searchUsers)
usersRoute.patch('/', AdminMiddleware, userControllers.updateUser)
usersRoute.delete('/', AdminMiddleware, userControllers.removeUser)
usersRoute.get('/authed_user', UserMiddleware, userControllers.getAuthedUser)
usersRoute.patch('/self', UserMiddleware, userControllers.updateAuthedUser)
usersRoute.patch('/password-update', UserMiddleware, userControllers.passwordUpdate)

export default usersRoute