import StringManipulators from "../../helpers/helper.string_methods.js"
import { Numerical_Entity, Regex } from "../../utils/static/index.js"

export default function AuthValidations() {
    const { ALPHA, PASSWORD, EMAIL, NUMERICAL, CSVDOT_HYPHEN, MONGOOBJECT } = Regex
    const { TWOINARRAY } = Numerical_Entity
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const validateRegistration = (data, next) => {
        let {
            firstname, lastname, email, phone, password, password_confirmation
        } = data
        firstname = cleanExcessWhiteSpaces(firstname)
        lastname = cleanExcessWhiteSpaces(lastname)
        phone = cleanExcessWhiteSpaces(phone)
        if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for firstname and lastname' }
        if (!password.match(PASSWORD)) return { error: 'Password must contain alphanumeric and special chars' }
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 50 || lastname.length < 3 || lastname.length > 50) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        next()
    }
    const passwordResetValidator = (user, code, password, password_confirmation, next) => {
        if (!user.toString().match(MONGOOBJECT) || code.length < 36) return { error: 'Bad request received' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (!password.match(PASSWORD)) return { error: 'Password must contain alphanumeric and special chars' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        return next()
    }
    const loginValidator = (email, password, next) => {
        if (!email.length || !password.length) return { error: 'Email and password required' }
        if (password.length < 8 || !password.match(PASSWORD)) return { error: 'Incorrect credentials' }
        if (!email.match(EMAIL)) return { error: 'Incorrect credentials' }
        return next()
    }
    const otpValidator = (user, otp, next) => {
        if (!user.toString().match(MONGOOBJECT) || !otp.toString().match(NUMERICAL)) return { error: 'Bad request' }
        if (otp.length !== 6) return { error: 'Incorrect OTP' }
        next()
    }
    const userUpdateValidator = (data, next) => {
        const { firstname, lastname, email, phone, usertype, gender, id } = data
        if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request received' }
        if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for firstname and lastname' }
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!phone.match(NUMERICAL) || cleanExcessWhiteSpaces(phone).length !== 10 ||
            parseInt(cleanExcessWhiteSpaces(phone).charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 50 || lastname.length < 3 || lastname.length > 50) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        if (![1, 2, 3, 4, 5].includes(Number(usertype))) return { error: 'Usertype was rejected' }
        if (!['male', 'female'].includes(gender.toLowerCase())) return { error: 'Gender rejected' }
        return next()
    }
    return {
        validateRegistration, passwordResetValidator, otpValidator, loginValidator, userUpdateValidator
    }
}