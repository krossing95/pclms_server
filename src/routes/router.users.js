import express from 'express'
import AuthController from '../controllers/auth/controller.auth.js'
import UsersController from '../controllers/users/users.controller.js'
import AdminMiddleware from "../middlewares/middleware.admin.js"

const usersRoute = express.Router()

const { register, resendOTP, verification, login } = AuthController()
const { getUsers, searchUsers, updateUser, removeUser } = UsersController()

usersRoute.post('/auth', register)
usersRoute.post('/auth/login', login)
usersRoute.post('/auth/verify', verification)
usersRoute.post('/auth/resend_otp', resendOTP)
usersRoute.get('/', getUsers)
usersRoute.get('/search', searchUsers)
usersRoute.patch('/', AdminMiddleware, updateUser)
usersRoute.delete('/', removeUser)

export default usersRoute