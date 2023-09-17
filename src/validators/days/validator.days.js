import { Regex } from "../../utils/static/index.js"
import moment from "moment"

const DaysValidations = () => {
    const { CSVDOT_HYPHEN } = Regex
    const validateDay = (data, next) => {
        const { name, date } = data
        if (!name.match(CSVDOT_HYPHEN) || name.length === 0) return { error: 'Name is required' }
        if (!moment(date).isValid()) return { error: 'Invalid date chosen' }
        if (moment(date).isBefore(moment(new Date()))) return { error: 'Cannot select a past dates' }
        const selectedDay = moment(date).day()
        if ((selectedDay === 6) || (selectedDay === 0)) return { error: 'Cannot select a weekend' }
        next()
    }
    return {
        validateDay
    }
}

export default DaysValidations