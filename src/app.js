// --------------------------------------------
// ✅ Core Dependencies
// --------------------------------------------
import csrf from "csurf"; // CSRF protection
import cors from "cors"; // Cross-Origin support
import helmet from "helmet"; // Secure HTTP headers
import express from "express"; // Core Express framework
import cookieParser from "cookie-parser"; // Parses cookies
import dotenv from "dotenv"; // Loads env variables from .env
import compression from "compression"; // Compresses HTTP responses
import useragent from "express-useragent"; // Parses user-agent string
import mongoSanitize from "express-mongo-sanitize"; // Protects against NoSQL injection

// --------------------------------------------
// ✅ Local Modules (Database, Routes, Middleware)
// --------------------------------------------
import connectToDatabase from "./database.js";
import userRoute from "./routes/userRoute.js";
import agentRoute from "./routes/agentRoute.js";
import adminRoute from "./routes/adminRoute.js";
import { handleError } from "./middlewares/errorHandler.js";
import { globalLimiter } from "./middlewares/reqLimiter.js";
import { isAdmin, isAgent } from "./middlewares/checkRole.js";
import authMiddleware from "./middlewares/verifyAuthentication.js";
import deviceInfoMiddleware from "./middlewares/deviceInfoMiddleware.js";
import requestLogger from "./middlewares/requestLoggerMiddleware.js";

// --------------------------------------------
// ✅ Environment Setup
// --------------------------------------------
dotenv.config(); // Load env vars from .env
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5000;

// --------------------------------------------
// ✅ Initialize Express App
// --------------------------------------------
const app = express();
app.set("trust proxy", isProduction ? 1 : 0); // Trust proxy if behind Nginx/Heroku

// --------------------------------------------
// ✅ Connect to MongoDB
// --------------------------------------------
connectToDatabase();

// --------------------------------------------
// ✅ Security & Performance Middleware
// --------------------------------------------

// Prevent NoSQL injection via payload/query
app.use(mongoSanitize());

// JSON and URL-encoded body parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Global rate limiter to prevent abuse
app.use(globalLimiter);

// Parses cookies (used for auth & CSRF tokens)
app.use(cookieParser());

// Device and browser info middleware
app.use(useragent.express());
app.use(deviceInfoMiddleware);

// Response compression for faster performance
app.use(compression());

// Custom structured request logger
app.use(requestLogger);

// --------------------------------------------
// ✅ CORS Configuration
// --------------------------------------------
app.use(cors({
    origin: isProduction ?[ process.env.FRONTEND_URL,"https://mern-real-estate-c10c6.firebaseapp.com"] : "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and credentials
}));

// --------------------------------------------
// ✅ Secure HTTP Headers (Helmet)
// --------------------------------------------
app.use(helmet({
    contentSecurityPolicy: isProduction
        ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
                styleSrc: ["'self'", "https://trusted-cdn.com"],
            },
        }
        : false, // Disable CSP in dev for ease of testing
    crossOriginResourcePolicy: { policy: "same-origin" },
    frameguard: { action: "deny" }, // Prevent clickjacking
    hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : undefined, // Enforce HTTPS in production
}));

// --------------------------------------------
// ✅ CSRF Protection (enabled in production only)
// --------------------------------------------
const csrfProtection = isProduction
    ? csrf({ cookie: true })
    : (req, res, next) => next(); // No-op in dev to avoid setup issues

// --------------------------------------------
// ✅ API Routes
// --------------------------------------------

app.head('/', (req, res) => res.status(200).end());

// Public user routes (with CSRF)
app.use("/api/user", csrfProtection, userRoute);

// Agent-only routes (auth → role → CSRF)
app.use("/api/agent", authMiddleware, isAgent, csrfProtection, agentRoute);

// Admin-only routes (auth → role → CSRF)
app.use("/api/admin", authMiddleware, isAdmin, csrfProtection, adminRoute);

// --------------------------------------------
// ✅ Global Error Handler (Always last)
// --------------------------------------------
app.use(handleError);

// --------------------------------------------
// ✅ Export App
// --------------------------------------------
export { app, port, isProduction };

//performance optimization, efficiency, maintainability, readability and security
