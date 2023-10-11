export default function HiddenEquipmentQuery() {
    const PAGINATE_HIDDEN_EQUIPMENT = `SELECT e.id, e.name, e.photo_url FROM equipment e WHERE e.is_deleted = true ORDER BY e.name ASC LIMIT $1 OFFSET $2`
    const GETHIDDENEQUIPMENTFORSEARCH = `SELECT e.id, e.name, e.photo_url FROM equipment e WHERE e.is_deleted = true ORDER BY e.name ASC`
    const GETHIDDENEQUIPMENT = `SELECT * FROM equipment WHERE id = $1`
    const RETRIEVEEQUIPMENT = `UPDATE equipment SET is_deleted = false WHERE id = $1`
    const CLOSEBOOKINGSONEQUIPMENT = `UPDATE bookings SET status = 3 WHERE equipment_id = $1`
    return {
        PAGINATE_HIDDEN_EQUIPMENT, GETHIDDENEQUIPMENTFORSEARCH, GETHIDDENEQUIPMENT, RETRIEVEEQUIPMENT,
        CLOSEBOOKINGSONEQUIPMENT
    }
}