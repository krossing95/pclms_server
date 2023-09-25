import DatabaseConnection from "../../config/config.db.js"
import url from "url"
import { Regex } from "../../utils/static/index.js"
import RequestBodyChecker from "../../helpers/helper.request_checker"
import BookingsQuery from "../../queries/query.bookings.js"
import BookingsValidations from "../../validators/bookings/validator.bookings.js"
import RequestInformation from "../../helpers/helper.request_sender.js"

const EquipmentBookingControllers = () => {
    const { pool } = DatabaseConnection()
    const WSWW = 'Whoops! Something went wrong'
    const regex = Regex
    const bookingQueries = BookingsQuery()
    const validations = BookingsValidations()
    const { isTrueBodyStructure } = RequestBodyChecker()


    const getBookingRequirements = async (req, res) => {
        return res.json({ ...req.body })
    }


    return {
        getBookingRequirements
    }
}
export default EquipmentBookingControllers