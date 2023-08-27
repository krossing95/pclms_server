import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import AuthQuery from "../../queries/query.auth.js"
import AuthValidations from "../../validators/auth/validator.auth.js"
import StringManipulators from "../../helpers/helper.string_methods.js"
import { genSaltSync, hashSync } from "bcrypt"
import * as JWT from 'jsonwebtoken'
import needle from "needle"
import RequestInformation from "../../helpers/helper.request_sender.js"
import moment from "moment"
import { Regex } from "../../utils/static/index.js"

export default function AuthController() {
    const WSWW = 'Whoops! Something went wrong'
    const { isTrueBodyStructure } = RequestBodyChecker()
    const { validateRegistration } = AuthValidations()
    const { cleanSCW, cleanExcessWhiteSpaces } = StringManipulators()
    const { pool } = DatabaseConnection()
    const { MONGOOBJECT, NUMERICAL } = Regex
    const { CHECKUSERINSTANCE, CREATEUSER, GETUSER } = AuthQuery()
    const SALT = genSaltSync(10)
    const { sign } = JWT.default


    const register = async (req, res) => {
        let { firstname, lastname, email, phone, password, password_confirmation } = req.body
        const expected_payload = ['firstname', 'lastname', 'email', 'phone', 'password', 'password_confirmation']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validateRegistration(req.body, async () => {
            firstname = cleanSCW(firstname)
            lastname = cleanSCW(lastname)
            email = email.trim()
            password = hashSync(password, SALT)
            phone = cleanExcessWhiteSpaces(phone)
            try {
                const checkUserInstance = await pool.query(CHECKUSERINSTANCE, [email, phone])
                if (checkUserInstance.rowCount > 0) return res.status(412).json({ message: 'Email address or phone number has been taken', code: '412', data: {} })
                const id = (new ObjectId()).toString()
                const timestamp = (new Date()).toISOString()
                const save = await pool.query(CREATEUSER, [id, firstname, lastname, email, phone, password, timestamp])
                if (save.rowCount === 0) return res.status(412).json({ message: 'Account could not be created', code: '412', data: {} })
                const data = {
                    expiry: 10, length: 6, medium: 'sms', message: `Dear ${lastname}, the OTP for your account verification is %otp_code% to verify your account. NOTE: OTP will expire in %expiry% minutes`,
                    number: `233${parseInt(phone)}`, sender_id: process.env.LMS_MESSENGER_NAME, type: 'numeric',
                }
                const sendOTP = await needle(
                    "post", process.env.LMS_OTP_GENERATION_URL,
                    data, {
                    headers: {
                        'api-key': process.env.LMS_MESSENGER_API_KEY,
                        'Content-Type': 'application/json'
                    }
                })
                if (sendOTP.body.code !== '1000') return res.status(500).json({ message: WSWW, code: '500', data: {} })
                let resendToken = sign({
                    tk_id: (new ObjectId()).toString(), id, tk_exp: (new Date()).toISOString()
                }, process.env.LMS_JWT_SECRET, { expiresIn: '1h' })
                resendToken = !resendToken ? undefined : resendToken
                return res.status(201).json({
                    message: 'Successfully registered, please check your phone to continue.',
                    code: '201', data: { id, firstname, lastname, email, phone, resend_otp_token: resendToken }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }
    const resendOTP = async (req, res) => {
        const { user_id, tk_value } = req.body
        const expected_payload = ['user_id', 'tk_value']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!user_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (tk_value.length === 0) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        req.headers['authorization'] = `Bearer ${tk_value}`
        try {
            const getUser = await pool.query(GETUSER, [user_id])
            if (getUser.rowCount !== 1) return res.status(404).json({ message: 'Account does not exists on this server', code: '404', data: {} })
            const data = getUser.rows[0]
            const request_info = RequestInformation(req, res)
            if (!Object.keys(request_info).includes('tk_exp')) return res.status(401).json({ message: 'Not eligible to request for OTP', code: '401', data: {} })
            const tk_exp = request_info.tk_exp
            if (!moment(tk_exp, true).isValid()) return res.status(401).json({ message: 'Not eligible to request for OTP', code: '401', data: {} })
            const currentTime = moment((new Date()).toISOString()), tokenExpTime = moment(tk_exp), diff = currentTime.diff(tokenExpTime, 'minutes')
            if (diff > 5) return res.status(401).json({ message: 'Not eligible to request for OTP', code: '401', data: {} })
            if (request_info.id !== user_id) return res.status(401).json({ message: 'Not eligible to request for OTP', code: '401', data: {} })
            const sms_data = {
                expiry: 10, length: 6, medium: 'sms', message: `Dear ${data.lastname}, the OTP for your account verification is %otp_code% to verify your account. NOTE: OTP will expire in %expiry% minutes`,
                number: `233${parseInt(data.phone)}`, sender_id: process.env.LMS_MESSENGER_NAME, type: 'numeric',
            }
            const reSendOTP = await needle(
                "post", process.env.LMS_OTP_GENERATION_URL,
                sms_data, {
                headers: {
                    'api-key': process.env.LMS_MESSENGER_API_KEY,
                    'Content-Type': 'application/json'
                }
            })
            if (reSendOTP.body.code !== '1000') return res.status(500).json({ message: WSWW, code: '500', data: {} })
            return res.status(200).json({
                message: 'OTP was resent. Please check your phone to continue.',
                code: '200', data: { id: data.id, firstname: data.firstname, lastname: data.lastname, email: data.email, phone: data.phone }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const verification = async (req, res) => {
        let { user_id, verification_code } = req.body
        const expected_payload = ['user_id', 'verification_code']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!user_id.match(MONGOOBJECT)) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        if (!verification_code.match(NUMERICAL)) return res.status(400).json({ message: 'Invalid OTP', code: '400', data: {} })
        if (verification_code.toString().length < 6) return res.status(400).json({ message: 'Invalid OTP', code: '400', data: {} })
        try {
            const getUser = await pool.query(GETUSER, [user_id])
            if (getUser.rowCount !== 1) return res.status(404).json({ message: 'Account does not exists on this server', code: '404', data: {} })
            const data = getUser.rows[0]
            const verifyOTP = await needle("post", process.env.LMS_OTP_VERIFICATION_URL,
                { api_key: process.env.LMS_MESSENGER_API_KEY, code: verification_code, number: `233${parseInt(data.phone)}` }, {
                headers: {
                    'api-key': process.env.LMS_MESSENGER_API_KEY,
                    'Content-Type': 'application/json'
                }
            })
            if (verifyOTP.body.code !== '1100') return res.status(412).json({ message: 'Incorrect OTP', code: '412', data: {} })
            const signedInUser = { user_id, firstname: data.firstname, lastname: data.lastname, email: data.email, usertype: data.usertype, phone: data.phone }
            const token = sign({ ...signedInUser }, process.env.LMS_JWT_SECRET, { expiresIn: '2h' })
            if (!token) return res.status(500).json({ message: WSWW, code: '500', data: {} })
            return res.status(200).json({
                message: 'Successful user verification',
                code: '200', data: {
                    user: { ...signedInUser, token }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }

    return {
        register, resendOTP, verification
    }
}