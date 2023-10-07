import StringManipulators from "../../helpers/helper.string_methods.js"
import { Regex } from "../../utils/static/index.js"

export default function UserValidations() {
    const { ALPHA, MONGOOBJECT, NUMERICAL, EMAIL, PASSWORD } = Regex
    const { cleanExcessWhiteSpaces } = StringManipulators()

    const validateUserUpdate = (data, next) => {
        let { id, firstname, lastname, email, phone, usertype } = data
        if (!id.match(MONGOOBJECT)) return { error: 'No records found' }
        firstname = cleanExcessWhiteSpaces(firstname)
        lastname = cleanExcessWhiteSpaces(lastname)
        phone = cleanExcessWhiteSpaces(phone)
        if (!email.match(EMAIL)) return { error: 'Incorrect email address' }
        if (!firstname.length || !lastname.length || !email.length || !phone.length) return { error: 'All fields are required' }
        if (!firstname.match(ALPHA) || !lastname.match(ALPHA)) return { error: 'Only English alphabets and whitespaces are allowed in names' }
        if (!phone.match(NUMERICAL) || phone.length !== 10 ||
            parseInt(phone.charAt(0)) !== 0
        ) return { error: 'Phone number must be a numerical string of 10 chars, starting with 0' }
        if (firstname.length < 3 || firstname.length > 30 || lastname.length < 3 || lastname.length > 30) return { error: 'Names must be in the range of 3 to 30 chars' }
        if (![1, 2, 3].includes(Number(usertype))) return { error: 'Chosen user role was rejected' }
        next()
    }

    const validatePasswordUpdate = (data, next) => {
        const { old_password, new_password, confirm_password } = data
        if (!old_password.match(PASSWORD) || !new_password.match(PASSWORD) || !confirm_password.match(PASSWORD)) return { error: 'Password must contain uppercase, lowercase alphabets, numbers and special chars' }
        if (old_password.length < 8 || new_password.length < 8) return { error: 'Password must contain at least 8 chars' }
        if (new_password !== confirm_password) return { error: 'Password do not match' }
        next()
    }

    return {
        validateUserUpdate, validatePasswordUpdate
    }
}