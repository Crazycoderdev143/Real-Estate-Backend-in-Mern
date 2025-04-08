import redisClient from '../services/redisClient.js';
import { DEFAULT_OPTIONS } from "../middlewares/rateLimiterMiddleware.js"


/**
 * Function to be called when login fails
 * Increments failed attempts and sets lockout if needed
 */
export const recordFailedAttempt = async (identifier) => {
    try {
        const key = `failedAttempts:${identifier}`;
        const failedData = await redisClient.hgetall(key);
        const count = parseInt(failedData.count || '0', 10);
        const now = Date.now();
        const unlockTimestamp = now + DEFAULT_OPTIONS.lockoutTime * 1000; // Calculate future unlock time

        if (count + 1 >= DEFAULT_OPTIONS.lockoutThreshold) {
            // Lock the user: set count, lastAttempt, and unlock time
            await redisClient.hset(key, 'count', count + 1, 'lastAttempt', now, 'unlockTime', unlockTimestamp);
            await redisClient.expireat(key, Math.floor(unlockTimestamp / 1000)); // Auto-remove key after lockout time
        } else {
            // Just increment failed count and update timestamp
            await redisClient.hset(key, 'count', count + 1, 'lastAttempt', now);
            await redisClient.expire(key, DEFAULT_OPTIONS.lockoutTime); // Set TTL in seconds
        }
    } catch (error) {
        console.error('Error recording failed attempt:', error);
    }
};

/**
 * Optional function to clear failed attempts on successful login
 */
export const resetFailedAttempts = async (usernameOrEmail) => {
    console.log("resetFailedAttempts")
    try {
        const key = `failedAttempts:${usernameOrEmail}`;
        await redisClient.del(key); // Clear key after successful login
    } catch (error) {
        console.error('Error resetting failed attempts:', error);
    }
};