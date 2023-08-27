export const Regex = {
    PASSWORD: /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,100}$/,
    EMAIL: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
    NUMERICAL: /^[0-9]+$/,
    ALPHA: /^[a-zA-Z ]*$/,
    ALPHANUMERIC: /^([a-zA-Z0-9 _-]+)$/,
    MONGOOBJECT: /^[0-9a-fA-F]{24}$/,
    SPECIALCHARS: /\W|_/g,
    CSVDOT_HYPHEN: /^[a-zA-Z0-9 .,-]{0,150}$/,
    ISBASE64: /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/,
    ISACADEMICYEAR: /^\d{4}-\d{4}$/,
    UNEXPECTED_ATTR: /[^\w\s]/gi,
    WHITESPACES: /\s{2,}/g,
    DECIMAL_NUM: /^\d+(\.\d{1,3})?$/
}
export const Numerical_Entity = {
    USERTYPE: [1, 2, 3],
    TWOINARRAY: [1, 2],
    THREEINARRAY: [1, 2, 3],
}