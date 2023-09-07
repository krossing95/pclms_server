export default function EquipmentQuery() {
    const PAGINATE_EQUIPMENT = `SELECT e.id, e.name, e.slug, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 ORDER BY e.name ASC LIMIT $2 OFFSET $3`
    const CHECKEQUIPMENT = `SELECT COUNT(*) AS equipment_exists FROM equipment WHERE name = $1`
    const SAVEEQUIPMENT = `INSERT INTO equipment (id, created_by, name, slug, description, system_error, functionality_status, availability_status, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9) RETURNING id`
    const GETEQUIPMENTFORSEARCH = `SELECT e.id, e.name, e.slug, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 ORDER BY e.name`
    const FILTEREQUIPMENTPREFIX = `SELECT e.id, e.name, e.slug, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id FROM equipment e INNER JOIN users u
    ON e.created_by = u.id WHERE e.is_deleted = $1 AND `
    return {
        PAGINATE_EQUIPMENT, CHECKEQUIPMENT, SAVEEQUIPMENT, GETEQUIPMENTFORSEARCH, FILTEREQUIPMENTPREFIX
    }
}