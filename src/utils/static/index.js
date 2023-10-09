export const Regex = {
    PASSWORD: /^(?=(.*[a-z]){1,})(?=(.*[A-Z]){1,})(?=(.*[0-9]){1,})(?=(.*['"{}|:;<>,?!@#$%^&*()\-__+.]){1,}).{8,}$/,
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
export const Slots_Array = [
    { id: 1, slot: '8:00am-8:30am' }, { id: 2, slot: '8:30am-9:00am' },
    { id: 3, slot: '9:00am-9:30am' }, { id: 4, slot: '9:30am-10:00am' },
    { id: 5, slot: '10:00am-10:30am' }, { id: 6, slot: '10:30am-11:00am' },
    { id: 7, slot: '11:00am-11:30am' }, { id: 8, slot: '11:30am-12:00pm' },
    { id: 9, slot: '12:00pm-12:30pm' }, { id: 10, slot: '12:30pm-1:00pm' },
    { id: 11, slot: '1:00pm-1:30pm' }, { id: 12, slot: '1:30pm-2:00pm' },
    { id: 13, slot: '2:00pm-2:30pm' }, { id: 14, slot: '2:30pm-3:00pm' },
    { id: 15, slot: '3:00pm-3:30pm' }, { id: 16, slot: '3:30pm-4:00pm' },
    { id: 17, slot: '4:00pm-4:30pm' }, { id: 18, slot: '4:30pm-5:00pm' }
]