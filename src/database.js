import mongoose from "mongoose";
import developmentConfig from "./config/development.js";
import productionConfig from "./config/production.js";
import dotenv from "dotenv";

dotenv.config();

const ENV = process.env.NODE_ENV || "development";
const config = ENV === "production" ? productionConfig : developmentConfig;

async function connectToDatabase() {
    const { uri, host, port, name, username, password } = config.database;

    console.log("config.database", config.database)

    // Use URI if provided (usually in production)
    const connectionString = uri || (
        username && password
            ? `mongodb://${username}:${password}@${host}:${port}/${name}`
            : `mongodb://${host}:${port}/${name}`
    );

    try {
        await mongoose.connect(connectionString);
        console.log(`[${ENV}] Successfully connected to the database:`, name);
    } catch (error) {
        console.error(`[${ENV}] Error connecting to the database:`, error.message);
        process.exit(1);
    }
}

export default connectToDatabase;
