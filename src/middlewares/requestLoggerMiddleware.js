// import logger from "../utils/logger.js";

// // Sanitize headers to mask sensitive data
// const sanitizeHeaders = (headers) => {
//     const sanitized = { ...headers };
//     if (sanitized.authorization) {
//         sanitized.authorization = "*****"; // Mask sensitive headers
//     }
//     return sanitized;
// };

// // Sanitize body to avoid large or non-serializable payloads
// const sanitizeBody = (body) => {
//     try {
//         return typeof body === "object"
//             ? JSON.stringify(body, (key, value) => (value && typeof value === "object" ? "[Circular]" : value)).substring(0, 1000)
//             : body;
//     } catch {
//         return "[Unserializable Body]";
//     }
// };


// // Middleware to log HTTP requests
// const loggerMiddleware = (req, res, next) => {
//     try {
//         const { method, url, headers, body } = req;
//         const startTime = Date.now();

//         // Log the request details
//         logger.http(`Incoming Request: ${method} ${url}`, {
//             headers: sanitizeHeaders(headers),
//             body: sanitizeBody(body),
//         });

//         // Check and manage event listeners to avoid max listener warnings
//         if (res.listenerCount("finish") === 0) {
//             res.once("finish", () => {
//                 try {
//                     const duration = Date.now() - startTime;
//                     logger.http(`Request Processed: ${method} ${url} - ${res.statusCode} [${duration}ms]`);
//                 } catch (error) {
//                     console.error("Error logging response:", error);
//                 }
//             });
//         }

//         if (res.listenerCount("close") === 0) {
//             res.once("close", () => {
//                 try {
//                     const duration = Date.now() - startTime;
//                     logger.warn(`Request Aborted: ${method} ${url} - [${duration}ms]`);
//                 } catch (error) {
//                     console.error("Error logging aborted request:", error);
//                 }
//             });
//         }

//         next();
//     } catch (error) {
//         console.error("Middleware error:", error);
//         next(error); // Pass the error to the next middleware or error handler
//     }
// };

// export default loggerMiddleware;


// import logger from "../utils/logger.js";
// import { v4 as uuidv4 } from "uuid"; // Generate unique request IDs

// const requestLogger = (req, res, next) => {
//     try {
//         const requestId = uuidv4();
//         const startTime = Date.now();

//         req.requestId = requestId; // Attach request ID to req object

//         logger.http(`[Request] ${req.method} ${req.url}`, {
//             requestId,
//             ip: req.ip,
//             userAgent: req.headers["user-agent"],
//             headers: req.headers,
//             body: req.body,
//         });

//         res.once("finish", () => {
//             const duration = Date.now() - startTime;
//             logger.http(`[Response] ${req.method} ${req.url} - ${res.statusCode} [${duration}ms]`, {
//                 requestId,
//                 status: res.statusCode,
//                 duration: `${duration}ms`,
//             });
//         });

//         next();
//     } catch (error) {
//         console.error("Request logging error:", error);
//         next();
//     }
// };

// export default requestLogger;



import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid"; // Generate unique request IDs

// Sanitize headers to mask sensitive data
const sanitizeHeaders = (headers) => {
    const sanitized = { ...headers };
    if (sanitized.authorization) {
        sanitized.authorization = "*****"; // Mask sensitive headers
    }
    return sanitized;
};

// Sanitize body to avoid large or non-serializable payloads
const sanitizeBody = (body) => {
    try {
        return typeof body === "object"
            ? JSON.stringify(body, (key, value) => (value && typeof value === "object" ? "[Circular]" : value)).substring(0, 1000)
            : body;
    } catch {
        return "[Unserializable Body]";
    }
};

// Middleware to log HTTP requests
const requestLogger = (req, res, next) => {
    try {
        const requestId = uuidv4(); // Generate a unique request ID
        const startTime = Date.now();

        req.requestId = requestId; // Attach request ID to req object

        logger.http(`[Request] ${req.method} ${req.url}`, {
            requestId,
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            headers: sanitizeHeaders(req.headers),
            body: sanitizeBody(req.body),
        });

        res.once("finish", () => {
            try {
                const duration = Date.now() - startTime;
                logger.http(`[Response] ${req.method} ${req.url} - ${res.statusCode} [${duration}ms]`, {
                    requestId,
                    status: res.statusCode,
                    duration: `${duration}ms`,
                });
            } catch (error) {
                logger.error("Error logging response:", error);
            }
        });

        res.once("close", () => {
            try {
                const duration = Date.now() - startTime;
                logger.warn(`[Request Aborted] ${req.method} ${req.url} - [${duration}ms]`, {
                    requestId,
                    status: "aborted",
                    duration: `${duration}ms`,
                });
            } catch (error) {
                logger.error("Error logging aborted request:", error);
            }
        });

        next();
    } catch (error) {
        logger.error("Request logging error:", error);
        next();
    }
};

export default requestLogger;