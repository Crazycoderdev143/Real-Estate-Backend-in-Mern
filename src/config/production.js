import defaultConfig from "./default.js";
import dotenv from "dotenv";

dotenv.config();

const prodConfig = {
    ...defaultConfig,
    app: {
        ...defaultConfig.app,
        port: process.env.PORT || 8080,
    },
    database: {
        ...defaultConfig.database,
        uri: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=${process.env.APP_NAME}`,
        name: process.env.DB_NAME || "SdkyEstate",
    },
    logging: {
        ...defaultConfig.logging,
        level: "error",
    },
    debugMode: false,
};

export default prodConfig;
