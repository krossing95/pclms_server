import StringManipulators from "../../helpers/helper.string_methods.js"
import { Regex } from "../../utils/static/index.js"

export default function UserValidations() {
    const { ALPHA, MONGOOBJECT, NUMERICAL, EMAIL } = Regex
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
        if (![1, 2, 3].includes(type => type === Number(usertype))) return { error: 'Chosen user role was rejected' }
        next()
    }

    return {
        validateUserUpdate
    }
}