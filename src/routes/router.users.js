import express from 'express'
import AuthController from '../controllers/auth/controller.auth.js'

const usersRoute = express.Router()

const { register, resendOTP, verification } = AuthController()

usersRoute.post('/auth', register)
usersRoute.post('/auth/verify', verification)
usersRoute.post('/auth/resend_otp', resendOTP)

export default usersRoute