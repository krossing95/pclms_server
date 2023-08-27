import fetch from "isomorphic-fetch"
import * as promise from "es6-promise"
promise.polyfill

export default async function BotActionChecker(request, captchaCode, next) {
    const isHuman = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
        method: "post",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
        },
        body: `secret=${process.env.LMS_RECAPTCHA_SECRET}&response=${captchaCode}`
    }).then(response => response.json()).then(json => json.success)
        .catch(err => {
            return
        })
    if (captchaCode === null || !isHuman) {
        return request.res.status(412).json({ message: 'Bot action detected', code: '412', data: {} })
    }
    return next()
}