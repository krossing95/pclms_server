import StringManipulators from "../../helpers/helper.string_methods.js"
import { Regex } from "../../utils/static/index.js"

export default function EquipmentValidations() {
    const { CSVDOT_HYPHEN, MONGOOBJECT } = Regex
    const { cleanExcessWhiteSpaces } = StringManipulators()


    const validateEquipment = (data, next) => {
        let { name, description, system_error, functionality_status, availability_status } = data
        name = cleanExcessWhiteSpaces(name)
        description = cleanExcessWhiteSpaces(description)
        system_error = cleanExcessWhiteSpaces(system_error)

        if (!name.length || !description.length) return { error: 'All fields are required' }
        if (!name.match(CSVDOT_HYPHEN)) return { error: 'Unexpected chars found in name' }
        if (name.length < 3 || name.length > 100) return { error: 'Name must be in the range of 3 to 100 chars' }
        if (description.length < 20) return { error: 'Enter a description of at least 20 chars for the equipment' }
        if (![true, false].includes(functionality_status)) return { error: 'Chosen functionality status was rejected' }
        if (![true, false].includes(availability_status)) return { error: 'Chosen availability status was rejected' }
        if (functionality_status === false && system_error.length < 5) return { error: 'Provide the system errors associated with the equipment' }
        next()
    }
    const validateComment = (data, next) => {
        let { equipment_id, comment } = data
        if (!equipment_id.match(MONGOOBJECT)) return { error: 'Request was rejected' }
        if (comment.length === 0) return { error: 'Comment field is required' }
        next()
    }
    return {
        validateEquipment, validateComment
    }
}