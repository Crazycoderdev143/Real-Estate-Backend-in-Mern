import mongoose from "mongoose";
import  logger  from "../utils/logger.js"; // Use a structured logging tool

// Error Handler Helper
export const handleError = (req, res, error) => {
    logger.error("Error occurred:", {
        message: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        ip: req.ip,
    });

    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            error: "Validation failed. Please check your input.",
            success: false,
        });
    }

    // Handle Mongoose duplicate key errors
    if (error.code === 11000) {
        return res.status(409).json({
            error: "Duplicate record detected. Please use unique values.",
            success: false,
        });
    }

    // Handle Mongoose or general database errors
    if (error instanceof mongoose.Error) {
        return res.status(500).json({
            error: "A database error occurred. Please try again later.",
            success: false,
        });
    }

    // Handle MongoDB network errors
    if (error.name === "MongoError" || error.code === "MongoNetworkError") {
        return res.status(503).json({
            error: "Database connection error. Please try again later.",
            success: false,
        });
    }

    // Handle known TCP connection errors
    const tcpErrors = [
        "ECONNREFUSED",
        "ECONNRESET",
        "ETIMEDOUT",
        "EPIPE",
        "EHOSTUNREACH",
        "ENETUNREACH",
        "EAI_AGAIN",
    ];

    if (tcpErrors.includes(error.code)) {
        return res.status(503).json({
            error: "A network-related error occurred. Please try again later.",
            success: false,
        });
    }

    // Default fallback for unexpected errors
    return res.status(500).json({
        error: "An internal server error occurred. Please try again later.",
        success: false,
    });
};
