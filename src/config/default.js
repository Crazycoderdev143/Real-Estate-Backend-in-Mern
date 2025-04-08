const defaultConfig = {
    app: {
        name: "SdkyEstate",
        port: 8000,
    },
    database: {
        host: "localhost",
        port: 27017,
        name: "SdkyEstate",
        username: "",
        password: "",
        uri: "", // Optional URI fallback
    },
    logging: {
        level: "info",
    },
};

export default defaultConfig;
