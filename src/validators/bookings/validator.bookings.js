import moment from 'moment'
import { Regex } from '../../utils/static/index.js'

export default function BookingsValidations() {
    const regex = Regex
    const validateSlotRequest = (data, next) => {
        const { equipment_id, date } = data
        if (!equipment_id.match(regex.MONGOOBJECT)) return { error: 'Invalid request' }
        if (!moment(date).isValid()) return { error: 'Invalid date chosen' }
        const selectedDay = moment(date).day()
        if ((selectedDay === 6) || (selectedDay === 0)) return { error: 'Cannot select a weekend' }
        next()
    }

    return {
        validateSlotRequest
    }
}
