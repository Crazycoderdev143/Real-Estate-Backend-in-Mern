import rateLimit from 'express-rate-limit';

// Create a rate limiter instance
export const globalLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hours
    max: 500, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again 5 hours later.',
    headers: true,
});

// Create a rate limiter instance
export const loginLimiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again 30 minutes later.',
    headers: true,
});

// Create a rate limiter instance
export const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    headers: true,
});