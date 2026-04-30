const {createLogger , format , transports} = require("winston");
const {combine , timestamp , errors , printf} = format;

const logFormat = printf(({level , message , timestamp , stack} ) =>
   `${timestamp} | ${level.toUpperCase()} | ${stack || (typeof message === "object" ? JSON.stringify(message) : message)}`
) 

const getLogger = (fileName) => createLogger({
   format : combine(
    timestamp({format : "YYYY-MM-DD HH:mm:ss"}),
    errors({stack : true}),
    logFormat
   ),
    transports : [
        new transports.File({
            filename : `./logs/${fileName}.log`}),
            new transports.Console()
    ]
})
module.exports = getLogger;