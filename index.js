import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cors from 'cors'
import { createServer } from 'http'
import usersRoute from './src/routes/router.users.js'
import daysRouter from './src/routes/router.days.js'
import equipmentRouter from './src/routes/router.equipment.js'

const app = express()
dotenv.config()
const PORT = process.env.PORT || process.env.LMS_PORT
app.use(helmet())
app.use(cors({
    origin: ['http://localhost:3000', 'https://pclms-app.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
}))
app.use(express.json({ limit: '5mb' }))
app.get('/', (req, res) => {
    return res.send(`Welcome to Laboratory Management System`)
})
app.use('/api/users', usersRoute)
app.use('/api/days_management', daysRouter)
app.use('/api/equipment', equipmentRouter)

const server = createServer(app)
server.listen(PORT, () => console.log(`Laboratory Management System is running on port ${PORT}`))