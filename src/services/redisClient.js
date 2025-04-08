import Redis from "ioredis";
import dotenv from "dotenv";
import logger from "../utils/logger.js"; // Structured logging (winston/pino recommended)

dotenv.config(); // Load environment variables

const isProduction = process.env.NODE_ENV === "production";

// Redis configuration
const redisConfig = {
    host:  process.env.REDIS_HOST ,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD ,
    // host: isProduction ? process.env.REDIS_HOST : "localhost",
    // port: isProduction ? Number(process.env.REDIS_PORT) : 6379,
    // password: isProduction ? process.env.REDIS_PASSWORD : null,
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 2000); // Exponential backoff (max 2s)
        logger.warn(`🔄 Redis reconnect attempt #${times} in ${delay}ms`);
        return delay;
    },
    connectTimeout: 10000, // 10s connection timeout
};

// Create Redis client
const redisClient = new Redis(redisConfig);

// Event listeners
redisClient.on("connect", () => logger.info("✅ Connected to Redis"));
redisClient.on("ready", () => logger.info("🚀 Redis is ready to use"));
redisClient.on("reconnecting", (time) => logger.warn(`♻️ Redis reconnecting in ${time}ms`));
redisClient.on("end", () => logger.error("⚠️ Redis connection closed"));
redisClient.on("warning", (msg) => logger.warn(`⚠️ Redis warning: ${msg}`));

// Handle errors
redisClient.on("error", (error) => {
    logger.error("❌ Redis Error:", { message: error.message, stack: error.stack });

    // Handle specific Redis errors
    if (error.code === "ECONNREFUSED") {
        logger.error("❌ Redis connection refused. Is the server running?");
    } else if (error.code === "ETIMEDOUT") {
        logger.error("⏳ Redis connection timed out");
    } else if (error.code === "ECONNRESET") {
        logger.error("🔄 Redis connection reset");
    } else if (error.code === "EPIPE") {
        logger.error("🚨 Redis broken pipe (lost connection)");
    }
});

// Graceful shutdown handler
const shutdown = async () => {
    logger.info("🛑 Shutting down Redis...");
    try {
        await redisClient.quit();
        logger.info("✅ Redis connection closed gracefully");
    } catch (error) {
        logger.error("❌ Error closing Redis:", error);
    }
    process.exit(0);
};

// Handle process termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default redisClient;
