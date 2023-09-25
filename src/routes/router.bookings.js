import express from 'express'
import UserMiddleware from '../middlewares/middleware.user.js'

const bookingRouter = express.Router()

bookingRouter.get('/', (req, res) => {
    console.log(true);
})

export default bookingRouter