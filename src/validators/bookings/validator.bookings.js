import moment from 'moment'
import { Regex, Slots_Array } from '../../utils/static/index.js'

export default function BookingsValidations() {
    const regex = Regex
    const validateSlotRequest = (data, next) => {
        const { equipment_id, date } = data
        if (!equipment_id.match(regex.MONGOOBJECT)) return { error: 'Invalid request' }
        if (!moment(date).isValid()) return { error: 'Invalid date chosen' }
        if (moment(date).isBefore(moment(new Date()))) return { error: 'Cannot select a past date' }
        const selectedDay = moment(date).day()
        if ((selectedDay === 6) || (selectedDay === 0)) return { error: 'Cannot select a weekend' }
        next()
    }

    const validateBooking = (data, next) => {
        const { equipment_id, date, need_assist, slots } = data
        if (!equipment_id.match(regex.MONGOOBJECT)) return { error: 'Request was rejected' }
        if (!moment(date).isValid()) return { error: 'Invalid date selected' }
        if (moment(date).isBefore(moment(new Date()))) return { error: 'Cannot select a past date' }
        const selectedDay = moment(date).day()
        if ((selectedDay === 6) || (selectedDay === 0)) return { error: 'Cannot select a weekend' }
        if (slots.length === 0) return { error: 'No slots picked' }
        if (!slots.every(slot => Slots_Array.some(item => item.slot !== slot))) return { error: 'Invalid slots selected' }
        if (![true, false].includes(need_assist)) return { error: 'Technical assistance data rejected' }
        next()
    }

    return {
        validateSlotRequest, validateBooking
    }
}
