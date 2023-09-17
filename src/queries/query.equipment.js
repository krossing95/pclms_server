export default function EquipmentQuery() {
    const PAGINATE_EQUIPMENT = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 ORDER BY e.name ASC LIMIT $2 OFFSET $3`
    const CHECKEQUIPMENT = `SELECT COUNT(*) AS equipment_exists FROM equipment WHERE name = $1`
    const SAVEEQUIPMENT = `INSERT INTO equipment (id, created_by, name, description, system_error, functionality_status, availability_status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`
    const GETEQUIPMENTFORSEARCH = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 ORDER BY e.name`
    const FILTEREQUIPMENTPREFIX = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 AND `
    const GETEQUIPMENT = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 AND e.id = $2`
    const GETEQUIPMENTBYNAME = `SELECT * FROM equipment WHERE name = $1`
    const SAVEFILE = `UPDATE equipment SET photo_id = $1, photo_url = $2, updated_at = $3 WHERE id = $4`
    const UPDATEEQUIPMENT = `UPDATE equipment SET name = $1, description = $2, system_error = $3, functionality_status = $4, 
    availability_status = $5, updated_at = $6 WHERE id = $7`
    const COUNTRELATEDBOOKINGS = `SELECT COUNT(*) AS related_bookings FROM bookings WHERE equipment_id = $1 AND status != $2`
    const REMOVEEQUIPMENT = `DELETE FROM equipment WHERE id = $1`
    return {
        PAGINATE_EQUIPMENT, CHECKEQUIPMENT, SAVEEQUIPMENT, GETEQUIPMENTFORSEARCH, FILTEREQUIPMENTPREFIX,
        GETEQUIPMENT, SAVEFILE, GETEQUIPMENTBYNAME, UPDATEEQUIPMENT, COUNTRELATEDBOOKINGS, REMOVEEQUIPMENT
    }
}