import * as JWT from 'jsonwebtoken'

export default function UserMiddleware(req, res, next) {
    const UNAUTH = 'Unauthorized request', { verify } = JWT.default
    const authorizer = req.headers['authorization']
    if (typeof authorizer === 'undefined') return res.status(401).json({ message: UNAUTH, code: '401', data: {} })
    const bearer = authorizer.split(' ', 2)
    if (bearer.length !== 2) return res.status(401).json({ message: UNAUTH, code: '401', data: {} })
    const token = bearer[1]
    return verify(token, process.env.LMS_JWT_SECRET, async (err, decoded) => {
        if (err) return res.status(401).json({ message: UNAUTH, code: '401', data: {} })
        if (typeof decoded === 'undefined') return res.status(401).json({ message: UNAUTH, code: '401', data: {} })
        const { usertype } = decoded
        req.usertype = usertype
        if (usertype === Number(process.env.LMS_USER) || usertype === Number(process.env.LMS_ADMIN)) return next()
        return res.status(401).json({ message: UNAUTH, code: '401', data: {} })
    })
}