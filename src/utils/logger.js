import { createLogger, format, transports, addColors } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { combine, timestamp, printf, colorize, json, errors } = format;
const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    colors: {
        error: "red",
        warn: "yellow",
        info: "green",
        http: "magenta",
        verbose: "cyan",
        debug: "blue",
        silly: "grey",
    },
};


// Define a custom log format
const customFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
});

// Create the logger instance
const logger = createLogger({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "warn" : "debug"),
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Adds a timestamp
        errors({ stack: true }), // Captures stack traces
        json() // Logs in JSON format for structured logging
    ),
    transports: [
        new transports.Console({
            format: process.env.NODE_ENV === "production"
                ? combine(customFormat)
                : combine(colorize(), customFormat),
        }), // Logs to the console with colorized output
        new DailyRotateFile({
            filename: "logs/application-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "20d", // Retain logs for 20 days
        }), // Rotating log file
        new transports.File({ filename: "logs/error.log", level: "error" }), // Separate file for errors
        new transports.File({ filename: "logs/combined.log" }), // Logs all levels to a combined file
    ],
    exceptionHandlers: [
        new transports.File({ filename: "logs/exceptions.log" }), // Logs uncaught exceptions
    ],
    rejectionHandlers: [
        new transports.File({ filename: "logs/rejections.log" }), // Logs unhandled promise rejections
    ],
});


process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at Promise:", { promise, reason });
});

process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception Thrown:", {
        message: error.message,
        stack: error.stack,
    });
});

// Add a production-specific transport
if (process.env.NODE_ENV === "production") {
    logger.add(
        new transports.File({ filename: "logs/production.log", level: "warn" }) // Production log level set to "warn"
    );
}

addColors(customLevels.colors);

export default logger;