import StringManipulators from "../../helpers/helper.string_methods.js"
import { Regex } from "../../utils/static/index.js"

export default function AuthValidations() {
    const { ALPHA, PASSWORD, EMAIL, NUMERICAL, MONGOOBJECT } = Regex
    const { cleanExcessWhiteSpaces } = StringManipulators()
    const validateRegistration = (data, next) => {
        let {
            firstname, lastname, email, phone, password, password_confirmation
        } = data
        firstname = cleanExcessWhiteSpaces(firstname)
        lastname = cleanExcessWhiteSpaces(lastname)
        phone = cleanExcessWhiteSpaces(phone)
        if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces allowed for firstname and lastname' }
        if (!password.match(PASSWORD)) return { error: 'The password must include a combination of uppercase and lowercase English letters, at least one digit, and at least one special character' }
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 50 || lastname.length < 3 || lastname.length > 50) return { error: 'Firstname and lastname must be in the range of 3 to 50 chars' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        next()
    }
    const passwordResetValidator = (data, next) => {
        const { user, code, password, password_confirmation } = data
        if (!user.match(MONGOOBJECT) || code.length < 36) return { error: 'No records found' }
        if (password.length < 8) return { error: 'Password must be of at least 8 chars' }
        if (!password.match(PASSWORD)) return { error: 'The password must include a combination of uppercase and lowercase English letters, at least one digit, and at least one special character' }
        if (password !== password_confirmation) return { error: 'Passwords do not match' }
        next()
    }
    const loginValidator = (phone, password, next) => {
        const cleanedPhoneNumber = cleanExcessWhiteSpaces(phone)
        if (!cleanedPhoneNumber.length || !password.length) return { error: 'Phone number and password required' }
        if (password.length < 8 || !password.match(PASSWORD)) return { error: 'Incorrect credentials' }
        if (!cleanedPhoneNumber.match(NUMERICAL) || cleanedPhoneNumber.length !== 10 ||
            parseInt(cleanedPhoneNumber.charAt(0)) !== 0
        ) return { error: 'Incorrect credentials' }
        next()
    }
    const otpValidator = (user, otp, next) => {
        if (!user.toString().match(MONGOOBJECT) || !otp.toString().match(NUMERICAL)) return { error: 'Bad request' }
        if (otp.length !== 6) return { error: 'Incorrect OTP' }
        next()
    }
    const userUpdateValidator = (data, next) => {
        const { firstname, lastname, email, phone, usertype, gender, id } = data
        if (!id.toString().match(MONGOOBJECT)) return { error: 'Bad request' }
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
    const validateForgotPassword = (phone, next) => {
        if (!phone.length) return { error: 'Field is required' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0) return { error: 'Incorrect phone number' }
        next()
    }
    return {
        validateRegistration, passwordResetValidator, otpValidator, loginValidator, userUpdateValidator,
        validateForgotPassword
    }
}