import { ObjectId } from "bson"
import DatabaseConnection from "../../config/config.db.js"
import RequestBodyChecker from "../../helpers/helper.request_checker.js"
import RequestInformation from "../../helpers/helper.request_sender.js"
import CommentQuery from "../../queries/query.comment.js"
import EquipmentValidations from "../../validators/equipment/validator.equipment.js"
import url from "url"
import StringManipulators from "../../helpers/helper.string_methods.js"
import Pagination from "../../helpers/helper.pagination.js"
import { Regex } from "../../utils/static/index.js"

export default function EquipmentCommentController() {
    const { isTrueBodyStructure } = RequestBodyChecker()
    const validations = EquipmentValidations()
    const WSWW = 'Whoops! Something went wrong'
    const { pool } = DatabaseConnection()
    const { CHECKEQUIPMENTANDCOMMENT, SAVECOMMENT, PAGINATE_COMMENTS, GETCOMMENT, UPDATECOMMENT } = CommentQuery()
    const { polishLongTexts } = StringManipulators()
    const { Setter, GetPageParams } = Pagination()
    const resultPerPage = Number(process.env.LMS_PAGE_DENSITY)
    const regex = Regex

    const postComment = async (req, res) => {
        let { equipment_id, comment } = req.body
        const expected_payload = ['equipment_id', 'comment']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validations.validateComment(req.body, async () => {
            try {
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id')) return res.status(412).json({ message: 'Cannot access the resource now', code: '412', data: {} })
                const userId = request_sender.user_id
                const checkEquipmentAndCommentExistence = await pool.query(CHECKEQUIPMENTANDCOMMENT, [equipment_id, userId])
                const data = checkEquipmentAndCommentExistence.rows[0]
                if (parseInt(data.equipment_exists) !== 1) return res.status(412).json({ message: 'Equipment does not exists', code: '412', data: {} })
                if (parseInt(data.has_commented) === 1) return res.status(412).json({ message: 'You have commented on this item already', code: '412', data: {} })
                comment = polishLongTexts(comment)
                const timestamp = (new Date()).toISOString()
                const id = (new ObjectId()).toString()
                await pool.query(SAVECOMMENT, [id, userId, equipment_id, comment, timestamp])

                const params = new URLSearchParams(url.parse(req.url, true).query)
                const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
                const paginationData = await GetPageParams(pageSize, 'comments', `equipment_id='${equipment_id}'`)
                const collection = await pool.query(PAGINATE_COMMENTS, [equipment_id, pageSize, offset])
                return res.status(201).json({
                    message: 'Comment posted successfully', code: '201', data: {
                        comments: [...collection.rows],
                        page_data: {
                            ...paginationData, currentPage: page, pageSize
                        }
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    const getComments = async (req, res) => {
        const params = new URLSearchParams(url.parse(req.url, true).query)
        if (!params.get('equipment_id')) return res.status(412).json({ message: 'No comments found', code: '412', data: {} })
        const equipment_id = params.get('equipment_id')
        if (!equipment_id.match(regex.MONGOOBJECT)) return res.status(412).json({ message: 'No comments found', code: '412', data: {} })
        try {
            const { pageSize, offset, page } = Setter(params, 1, resultPerPage)
            const paginationData = await GetPageParams(pageSize, 'comments', `equipment_id='${equipment_id}'`)
            const collection = await pool.query(PAGINATE_COMMENTS, [equipment_id, pageSize, offset])
            return res.status(200).json({
                message: 'Comment posted successfully', code: '200', data: {
                    comments: [...collection.rows],
                    page_data: {
                        ...paginationData, currentPage: page, pageSize
                    }
                }
            })
        } catch (error) {
            return res.status(500).json({ message: WSWW, code: '500', data: {} })
        }
    }
    const updateComment = async (req, res) => {
        let { id, comment } = req.body
        const expected_payload = ['id', 'comment']
        const checkPayload = isTrueBodyStructure(req.body, expected_payload)
        if (!checkPayload) return res.status(400).json({ message: 'Bad request', code: '400', data: {} })
        const validate = validations.validateComment(req.body, async () => {
            try {
                const request_sender = RequestInformation(req, res)
                if (!Object.keys(request_sender).includes('user_id')) return res.status(412).json({ message: 'Cannot access the resource now', code: '412', data: {} })
                const userId = request_sender.user_id
                const getComment = await pool.query(GETCOMMENT, [id])
                if (getComment.rowCount === 0) return res.status(412).json({ message: 'Comment does not exists', code: '412', data: {} })
                const data = getComment.rows[0]
                if (data.user_id !== userId) return res.status(412).json({ message: 'Access denied', code: '412', data: {} })
                const timestamp = (new Date()).toISOString()
                comment = polishLongTexts(comment)
                await pool.query(UPDATECOMMENT, [comment, timestamp, id])
                return res.status(200).json({
                    message: 'Comment updated successfully', code: '200', data: {
                        ...data,
                        comment,
                        updated_at: timestamp
                    }
                })
            } catch (error) {
                return res.status(500).json({ message: WSWW, code: '500', data: {} })
            }
        })
        if (validate !== undefined) return res.status(412).json({ message: validate.error, code: '412', data: {} })
        return validate
    }

    return {
        postComment, getComments, updateComment
    }
}