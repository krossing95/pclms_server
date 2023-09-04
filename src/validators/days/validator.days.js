import { Regex } from "../../utils/static/index.js"
import moment from "moment"

const DaysValidations = () => {
    const { CSVDOT_HYPHEN } = Regex
    const validateDay = (data, next) => {
        const { name, date } = data
        if (!name.match(CSVDOT_HYPHEN) || name.length === 0) return { error: 'Name is required' }
        if (!moment(date).isValid()) return { error: 'Invalid date chosen' }
        next()
    }
    return {
        validateDay
    }
}

export default DaysValidations