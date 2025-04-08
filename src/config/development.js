import defaultConfig from "./default.js";

const devConfig = {
    ...defaultConfig,
    app: {
        ...defaultConfig.app,
        port: 8000,
    },
    database: {
        ...defaultConfig.database,
        name: "SdkyEstate",
    },
    logging: {
        ...defaultConfig.logging,
        level: "debug",
    },
    debugMode: true,
};

export default devConfig;
