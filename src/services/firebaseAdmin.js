import firebaseAdmin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const requiredKeys = [
    "FB_TYPE",
    "FB_PROJECT_ID",
    "FB_PRIVATE_KEY_ID",
    "FB_PRIVATE_KEY",
    "FB_CLIENT_EMAIL",
    "FB_CLIENT_ID",
    "FB_AUTH_URI",
    "FB_TOKEN_URI",
    "FB_AUTH_PROVIDER_CERT_URL",
    "FB_CLIENT_CERT_URL",
];

function validateEnvVars(keys) {
    const missing = keys.filter((key) => !process.env[key]);
    if (missing.length) {
        throw new Error(`Missing Firebase environment variables: ${missing.join(", ")}`);
    }
}

function getServiceAccountFromEnv() {
    return {
        type: process.env.FB_TYPE,
        project_id: process.env.FB_PROJECT_ID,
        private_key_id: process.env.FB_PRIVATE_KEY_ID,
        private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FB_CLIENT_EMAIL,
        client_id: process.env.FB_CLIENT_ID,
        auth_uri: process.env.FB_AUTH_URI,
        token_uri: process.env.FB_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT_URL,
        client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
    };
}

try {
    validateEnvVars(requiredKeys);

    if (!firebaseAdmin.apps.length) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(getServiceAccountFromEnv()),
        });

        if (process.env.NODE_ENV !== "production") {
            console.log("✅ Firebase Admin initialized (env-based).");
        }
    }
} catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    process.exit(1);
}

export default firebaseAdmin;
