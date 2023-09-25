import DatabaseConnection from "../../config/config.db.js"
import { Regex } from "../../utils/static/index.js"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import url from "url"
import { ObjectId } from "bson"

export default function BookingControllers() {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const bookingQueries = BookingsQuery()
    const validations = BookingsValidations()
    const { isTrueBodyStructure } = RequestBodyChecker()


    const getBookingRequirements = async (req, res) => {

    }

    const getBookingSlots = (req, res) => {

    }

    const EquipmentBooking = async (res, userId, equipment_id, date, need_assist, slots) => {

    }

    const bookEquipment = (req, res) => {

    }

    return {
        getBookingRequirements, getBookingSlots, bookEquipment
    }
}