export default function CommentQuery() {
    const CHECKEQUIPMENTANDCOMMENT = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE id = $1) AS equipment_exists,
    (SELECT COUNT(c.id) FROM comments c WHERE c.equipment_id = $1 AND c.user_id = $2) AS has_commented`
    const SAVECOMMENT = `INSERT INTO comments (id, user_id, equipment_id, comment, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`
    const PAGINATE_COMMENTS = `SELECT c.id, c.comment, c.created_at, c.updated_at, u.id AS user_id, u.firstname, u.lastname,
    e.name AS equipment_name, c.equipment_id FROM comments c INNER JOIN users u ON c.user_id = u.id INNER JOIN 
    equipment e ON e.id = c.equipment_id WHERE c.equipment_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`
    const GETCOMMENT = `SELECT c.id, c.comment, c.created_at, c.updated_at, u.id AS user_id, u.firstname, u.lastname,
    e.name AS equipment_name, c.equipment_id FROM comments c INNER JOIN users u ON c.user_id = u.id INNER JOIN 
    equipment e ON e.id = c.equipment_id WHERE c.id = $1`
    const UPDATECOMMENT = `UPDATE comments SET comment = $1, updated_at = $2 WHERE id = $3`
    return {
        CHECKEQUIPMENTANDCOMMENT, SAVECOMMENT, PAGINATE_COMMENTS, GETCOMMENT, UPDATECOMMENT
    }
}