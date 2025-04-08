import redisClient from '../services/redisClient.js';

export const DEFAULT_OPTIONS = {
    lockoutThreshold: 3, // Max failed attempts before lockout
    lockoutTime: 3 * 60 * 60, // Lockout time in seconds (3 hours)
};

/**
 * Rate Limiter Middleware
 * @param {Object} options - Custom configurations for rate limiting.
 */
export const rateLimiter = (options = {}) => {
    const config = { ...DEFAULT_OPTIONS, ...options };

    return async (req, res, next) => {
        const usernameOrEmail = req.body.usernameOrEmail;
        if (!usernameOrEmail) {
            return res.status(400).json({ message: 'Username or Email is required.', success: false });
        }

        const key = `failedAttempts:${usernameOrEmail}`;

        try {
            const failedData = await redisClient.hgetall(key);
            const count = parseInt(failedData.count || '0', 10);
            const lastAttempt = parseInt(failedData.lastAttempt || '0', 10);
            const now = Date.now();

            // If user is locked out
            if (count >= config.lockoutThreshold) {
                const timeLeft = Math.max(0, config.lockoutTime - Math.floor((now - lastAttempt) / 1000));

                // Convert timeLeft (seconds) to HH:MM:SS
                const formattedTimeLeft = new Date(timeLeft * 1000).toISOString().substr(11, 8);
                if (timeLeft > 0) {
                    return res.status(429).json({
                        message: `Too many attempts. Try again in ${formattedTimeLeft}.`,
                        timeLeft: formattedTimeLeft,
                        success: false,
                    });
                }
                // Reset failed attempts after lockout expires
                await redisClient.del(key);
            }

            next();
        } catch (error) {
            console.error('Rate limiter error:', error);
            res.status(500).json({ message: 'Internal server error.', success: false });
        }
    };
};






// ////////////////////////////////this code show lockout time in HH:MM:SS /////////////////////////////
// const timeLeft = Math.max(0, config.lockoutTime - Math.floor((now - lastAttempt) / 1000));

// // Convert timeLeft (seconds) to HH:MM:SS
// const formattedTimeLeft = new Date(timeLeft * 1000).toISOString().substr(11, 8);
// if (timeLeft > 0) {
//     return res.status(429).json({
//         message: `Too many attempts. Try again in ${formattedTimeLeft}.`,
//         timeLeft: formattedTimeLeft,
//         success: false,
//     });
// }
// // Reset failed attempts after lockout expires
// await redisClient.del(key);




///////////////////////////////// This code Show Exact time to Lockout ////////////////////////////////
// // Correct calculation of unlock time
// const unlockTime = lastAttempt + config.lockoutTime * 1000; // When the lockout ends
// console.log("UnlockTime:", new Date(unlockTime).toLocaleTimeString(), "Now:", new Date(now).toLocaleTimeString());
// if (unlockTime > now) {
//     // User is still locked out, show the remaining time
//     const formattedUnlockTime = new Date(unlockTime).toLocaleTimeString();
//     return res.status(429).json({
//         message: `Too many attempts. Try again at ${formattedUnlockTime}.`,
//         unlockTime: formattedUnlockTime,
//         success: false,
//     });
// }













// import redisClient from '../services/redisClient.js'; // Import Redis client

// // Default configuration options for rate limiting
// export const DEFAULT_OPTIONS = {
//     lockoutThreshold: 3,          // Number of failed attempts allowed before lockout
//     lockoutTime: 3 * 60 * 60,     // Lockout time in seconds (3 hours)
// };

// /**
//  * Rate Limiter Middleware
//  * @param {Object} options - Override default options if needed
//  */
// export const rateLimiter = (options = {}) => {
//     const config = { ...DEFAULT_OPTIONS, ...options };

//     return async (req, res, next) => {
//         // Get user identifier (username/email) or fallback to IP
//         const identifier = req.body.usernameOrEmail || req.ip;
//         if (!identifier) {
//             return res.status(400).json({ message: 'Username or Email is required.', success: false });
//         }

//         const key = `failedAttempts:${identifier}`; // Redis key for storing attempts

//         try {
//             // Get existing attempt data from Redis
//             const failedData = await redisClient.hgetall(key);
//             const count = parseInt(failedData.count || '0', 10);              // How many failed attempts
//             const unlockTime = parseInt(failedData.unlockTime || '0', 10);    // When lockout ends
//             const now = Date.now();

//             // Check if user is locked out
//             if (count >= config.lockoutThreshold) {
//                 if (unlockTime > now) {
//                     // If still locked, format unlock time as HH:MM:SS
//                     const formattedUnlockTime = new Date(unlockTime).toLocaleTimeString();
//                     return res.status(429).json({
//                         message: `Too many attempts. Try again at ${formattedUnlockTime}.`,
//                         unlockTime: formattedUnlockTime,
//                         success: false,
//                     });
//                 }
//                 // Lockout has expired, reset attempts
//                 await redisClient.del(key);
//             }

//             // Proceed to the next middleware or controller
//             next();
//         } catch (error) {
//             console.error('Rate limiter error:', error);
//             res.status(500).json({ message: 'Internal server error.', success: false });
//         }
//     };
// };

