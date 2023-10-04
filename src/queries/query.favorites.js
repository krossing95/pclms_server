export default function FavoriteQuery() {
    const PAGINATE_FAVORITES = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id, 
	s.is_saved FROM equipment e INNER JOIN users u
    ON e.created_by = u.id INNER JOIN saves s ON s.equipment_id = e.id 
	WHERE e.is_deleted = false AND s.user_id = $1
	AND s.is_saved = true ORDER BY e.name ASC`
    const FILTERFAVORITESPREFIX = `SELECT e.id, e.name, e.description, e.system_error,
    e.functionality_status, e.availability_status, e.photo_url, e.photo_id, 
    e.created_at, e.updated_at, u.firstname, u.lastname, u.id AS user_id, 
	s.is_saved FROM equipment e INNER JOIN users u
    ON e.created_by = u.id INNER JOIN saves s ON s.equipment_id = e.id 
	WHERE e.is_deleted = false AND s.user_id = $1
	AND s.is_saved = true AND `
    return {
        PAGINATE_FAVORITES, FILTERFAVORITESPREFIX
    }
}