export default function DashboardQuery() {
    const GETUSERDATA = `SELECT
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = true ) AS available_equipment,
    (SELECT COUNT(id) FROM equipment WHERE is_deleted = false AND availability_status = false ) AS unavailable_equipment`

    return {
        GETUSERDATA
    }
}