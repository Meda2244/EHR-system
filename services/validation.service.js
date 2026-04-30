const joi = require("joi");

let newUserSchema = joi.object({
    firstName: joi.string().required(),
    lastName: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string()
        .min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
    nationalId: joi.string()
        .length(14)
        .pattern(/^[0-9]+$/)
        .required(),
    birthDate: joi.string().required(),
    phoneNumber: joi.string()
        .length(11)
        .pattern(/^[0-9]+$/)
        .required(),
});

let loginUserSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string()
        .min(6)
        .required()
        .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')),
});

module.exports = { newUserSchema, loginUserSchema };