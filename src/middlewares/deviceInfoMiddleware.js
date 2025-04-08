import { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Configure the logger
const logger = createLogger({
    level: process.env.LOG_LEVEL || "info", // Default log level
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: "logs/deviceInfo-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "10d", // Retain logs for 10 days
        }), // Rotating log file for general logs
        new transports.File({ filename: "logs/deviceInfoError.log", level: "error" }), // Error logs
        new transports.File({ filename: "logs/deviceInfoCombined.log", level: "info" }), // Info logs
    ],
});

// Function to mask IP addresses
const maskIP = (ip) => ip?.replace(/(\d+\.\d+\.\d+)\.\d+/, "$1.xxx") || "Unknown";

// Middleware to log device info
const deviceInfoMiddleware = async (req, res, next) => {
    try {
        const deviceInfo = {
            browser: req.useragent?.browser || "Unknown",
            version: req.useragent?.version || "Unknown",
            os: req.useragent?.os || "Unknown",
            platform: req.useragent?.platform || "Unknown",
            isMobile: req.useragent?.isMobile || false,
            isDesktop: req.useragent?.isDesktop || false,
            isTablet: req.useragent?.isTablet || false,
            ip: maskIP(req.headers["x-forwarded-for"] || req.socket.remoteAddress),
        };

        // Log device info with 'info' level
        logger.info({
            message: "Device Info",
            timestamp: new Date().toLocaleString(),
            deviceInfo,
        });

        req.deviceInfo = deviceInfo;
        next();
    } catch (error) {
        // Log error information with 'error' level
        logger.error({
            message: "Error in deviceInfoMiddleware",
            timestamp: new Date().toLocaleString(),
            error: error.message,
        });
        next(error); // Pass the error to the next middleware or error handler
    }
};

export default deviceInfoMiddleware;









// /project-root
// │
// ├── /src                    # Main source code folder
// │   ├── /config             # Configuration files for environment, constants, etc.
// │   │   ├── default.js      # Default configuration
// │   │   ├── development.js  # Development - specific config
// │   │   └── production.js   # Production - specific config
// │   │
// │   ├── /controllers        # Logic to handle API requests
// │   │   ├── userController.js  # User - related operations
// │   │   └── authController.js  # Authentication logic
// │   │
// │   ├── /models             # Database models (schemas/ORM definitions)
// │   │   ├── userModel.js    # User schema
// │   │   └── orderModel.js   # Order schema
// │   │
// │   ├── /routes             # API endpoints definitions
// │   │   ├── userRoutes.js   # User - related routes
// │   │   └── authRoutes.js   # Auth - related routes
// │   │
// │   ├── /middlewares        # Middleware functions for request lifecycle
// │   │   ├── authMiddleware.js  # Authorization checks
// │   │   └── errorMiddleware.js # Error handling middleware
// │   │
// │   ├── /services           # Reusable services for business logic or integrations
// │   │   ├── emailService.js # Sending emails
// │   │   └── paymentService.js # Payment handling
// │   │
// │   ├── /utils              # Helper functions (e.g., validation, logging)
// │   │   ├── logger.js       # Logging utilities
// │   │   └── validator.js    # Input validation
// │   │
// │   ├── /database           # Database connection and initialization
// │   │   └── index.js        # Main database connection logic
// │   │
// │   ├── /docs               # API documentation (Swagger, Postman)
// │   │   └── api - docs.json   # API specification
// │   │
// │   ├── app.js              # Initializes Express app and middleware
// │   ├── server.js           # Starts the server
// │   └── cron.js             # Scheduled tasks(optional)
// │
// ├── /public                 # Static files (e.g., images, CSS, uploads)
// │   └── uploads             # User - uploaded files(optional)
// │
// ├── /scripts                # Custom scripts for setup, migrations, or utilities
// │   └── migrate.js          # Example: DB migration script
// │
// ├── /test               # Test cases for different layers
// │   ├── controllers     # Tests for controllers
// │   ├── models          # Tests for models
// │   └── utils           # Tests for utilities
// │
// ├── .env                    # Environment variables
// ├── .gitignore              # Git ignored files
// ├── package.json            # Node.js project metadata and dependencies
// ├── package - lock.json       # Lockfile for dependencies
// └── README.md               # Project documentation
