const { newUserSchema, loginUserSchema } = require("../services/validation.service");
const loggerEvent = require("../services/logger.service");
const logger = loggerEvent("user");

function newUserValidation(req, res, next) {
    const { error } = newUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).send({
            message: error.details.map(detail => detail.message)
        });
    }
    next();
}

function loginUserValidation(req, res, next) {
    const { error } = loginUserSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).send({
            message: error.details.map(detail => detail.message)
        });
    }
    next();
}

module.exports = { newUserValidation, loginUserValidation };