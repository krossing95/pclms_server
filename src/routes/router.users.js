import express from 'express'
import AuthController from '../controllers/auth/controller.auth.js'
import UsersController from '../controllers/users/users.controller.js'

const usersRoute = express.Router()

const { register, resendOTP, verification, login } = AuthController()
const { getUsers, searchUsers } = UsersController()

usersRoute.post('/auth', register)
usersRoute.post('/auth/login', login)
usersRoute.post('/auth/verify', verification)
usersRoute.post('/auth/resend_otp', resendOTP)
usersRoute.get('/', getUsers)
usersRoute.get('/search', searchUsers)

export default usersRoute