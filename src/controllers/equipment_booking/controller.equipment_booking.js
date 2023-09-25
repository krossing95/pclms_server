const EquipmentBookingControllers = () => {
    const getBookingRequirements = async (req, res) => {
        return res.json({ ...req.body })
    }


    return {
        getBookingRequirements
    }
}
export default EquipmentBookingControllers