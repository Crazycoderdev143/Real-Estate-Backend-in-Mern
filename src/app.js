// --------------------------------------------
// ✅ Core Dependencies
// --------------------------------------------
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import csrf from "csurf";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import useragent from "express-useragent";

// --------------------------------------------
// ✅ Local Modules
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
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 8000;

if (isProduction && !process.env.FRONTEND_URL) {
    throw new Error("FRONTEND_URL must be defined in production.");
}

// --------------------------------------------
// ✅ Initialize Express App
// --------------------------------------------
const app = express();

// Trust first proxy in production (needed for secure cookies, HTTPS)
app.set("trust proxy", isProduction ? 1 : 0);

// --------------------------------------------
// ✅ Connect to MongoDB
// --------------------------------------------
connectToDatabase();

// --------------------------------------------
// ✅ General Middleware Setup
// --------------------------------------------

// Sanitize inputs to prevent NoSQL injection attacks
app.use(mongoSanitize());

// Parse JSON and URL-encoded request bodies (with size limit)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Apply global rate limiter to protect against abuse and DoS
app.use(globalLimiter);

// Parse cookies (needed for auth and CSRF)
app.use(cookieParser());

// Extract user agent and device info
app.use(useragent.express());
app.use(deviceInfoMiddleware());

// Compress all responses for better performance
app.use(compression());

// Log structured request metadata
app.use(requestLogger);

// --------------------------------------------
// ✅ CORS Setup
// Allows secure cross-origin requests (cookies, headers)
// --------------------------------------------
app.use(cors({
    origin: isProduction
        ? [process.env.FRONTEND_URL, "https://real-estate-frontend-in-mern.onrender.com"]
        : ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // Allow cookies and headers across origins
}));

// --------------------------------------------
// ✅ Helmet Security Headers
// Adds protection against XSS, clickjacking, etc.
// --------------------------------------------
app.use(helmet({
    contentSecurityPolicy: isProduction
        ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "https://trusted-cdn.com",
                    "https://accounts.google.com",
                    "https://apis.google.com"
                ],
                styleSrc: [
                    "'self'",
                    "https://trusted-cdn.com",
                    "https://fonts.googleapis.com"
                ],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                objectSrc: ["'none'"], // Disallow Flash/ActiveX
                upgradeInsecureRequests: [], // Force HTTPS requests
            },
        }
        : false, // Disable CSP in development for convenience
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow fonts/images from CDN
    frameguard: { action: "deny" }, // Prevent clickjacking
    hsts: isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true } // Enforce HTTPS
        : false,
    referrerPolicy: { policy: "no-referrer" }, // Don't leak referer data
}));

// --------------------------------------------
// ✅ Extra Security Headers (for OAuth popups)
// --------------------------------------------
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME-type sniffing
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups"); // Required for Google OAuth popup
    next();
});

// --------------------------------------------
// ✅ CSRF Protection (enabled in production)
// Prevents cross-site request forgery via cookies
// --------------------------------------------
const maybeCsrfProtection = isProduction
    ? csrf({ cookie: { httpOnly: true, sameSite: "strict", secure: true } })
    : (req, res, next) => next(); // Disable in development


// --------------------------------------------
// ✅ Define Routes
// Public, protected, and role-specific
// --------------------------------------------

// Health check
app.head("/", (req, res) => res.status(200).end());

// Public user routes (register, login, etc.)
app.use("/api/user", maybeCsrfProtection, userRoute);

// Agent-only routes (require auth, agent role, and CSRF)
app.use("/api/agent", authMiddleware, isAgent, maybeCsrfProtection, agentRoute);

// Admin-only routes (require auth, admin role, and CSRF)
app.use("/api/admin", authMiddleware, isAdmin, maybeCsrfProtection, adminRoute);

// --------------------------------------------
// ✅ Global Error Handler
// Always register after all routes
// --------------------------------------------
app.use(handleError);

// --------------------------------------------
// ✅ Export App
// Used by entry point or for testing
// --------------------------------------------
export { app, port, isProduction };