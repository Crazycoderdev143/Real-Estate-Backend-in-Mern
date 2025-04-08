// import fs from "fs";
// import firebaseAdmin from "firebase-admin";



// const serviceAccount = JSON.parse(fs.readFileSync("./src/services/serviceAccountKey.json", "utf-8"));

// firebaseAdmin.initializeApp({
//     credential: firebaseAdmin.credential.cert(serviceAccount),
// });

// export default firebaseAdmin;



import fs from "fs";
import firebaseAdmin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

let serviceAccount;

try {
    if (process.env.USE_FIREBASE_ENV === "true") {
        // ✅ Load credentials from .env (best for production & CI/CD)
        serviceAccount = {
            type: process.env.FB_TYPE,
            project_id: process.env.FB_PROJECT_ID,
            private_key_id: process.env.FB_PRIVATE_KEY_ID,
            private_key: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            client_email: process.env.FB_CLIENT_EMAIL,
            client_id: process.env.FB_CLIENT_ID,
            auth_uri: process.env.FB_AUTH_URI,
            token_uri: process.env.FB_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT_URL,
            client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
        };
    } else {
        // ✅ Fallback for local development
        const rawKey = fs.readFileSync("./src/services/serviceAccountKey.json", "utf-8");
        serviceAccount = JSON.parse(rawKey);
    }

    // ✅ Initialize Firebase Admin SDK
    if (!firebaseAdmin.apps.length) {
        firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
        });
        console.log("✅ Firebase Admin initialized successfully.");
    }
} catch (err) {
    console.error("❌ Firebase Admin initialization failed:", err.message);
    process.exit(1);
}

export default firebaseAdmin;
