import express from 'express'
import AuthController from '../controllers/auth/controller.auth.js'

const usersRoute = express.Router()

const { register, resendOTP, verification, login } = AuthController()

usersRoute.post('/auth', register)
usersRoute.post('/auth/login', login)
usersRoute.post('/auth/verify', verification)
usersRoute.post('/auth/resend_otp', resendOTP)

export default usersRoute