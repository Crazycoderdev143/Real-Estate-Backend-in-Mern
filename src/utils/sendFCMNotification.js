import FCMToken from '../models/FCMTokenModel.js';
import firebaseAdmin from '../services/firebaseAdmin.js';
import Notification from '../models/notificationModel.js';

/**
 * Builds a notification message and payload.
 * @param {Object} property - The property object.
 * @returns {Object} message and payload for FCM.
 */
const buildPayload = (property) => {
    const { title, city, state, country, _id, imageUrls = [] } = property;
    const imageUrl = imageUrls[0] || "";

    const message = `New property "${title}" listed in ${city}, ${state}, ${country}`;

    return {
        message,
        payload: {
            notification: {
                title: "New Property Listed",
                body: message,
                image: imageUrl || undefined,
            },
            data: {
                type: "property",
                url: `/property/${_id}`,
                imageUrl,
            }
        },
        imageUrl
    };
};

/**
 * Saves the notification to the database.
 */
const saveNotificationToDB = async (message, imageUrl, propertyId) => {
    const notification = new Notification({
        type: "property",
        title: "New Property Listed",
        message,
        imageUrl,
        url: `/property/${propertyId}`
    });

    await notification.save();
};

/**
 * Sends FCM messages to token chunks with failure handling.
 */
const sendToTokenChunks = async (tokens, payload) => {
    const chunkSize = 500;

    for (let i = 0; i < tokens.length; i += chunkSize) {
        const chunk = tokens.slice(i, i + chunkSize);
        const response = await firebaseAdmin.messaging().sendEachForMulticast({
            tokens: chunk,
            ...payload,
        });

        // Handle failed tokens
        const failedTokens = chunk.filter((_, idx) => {
            const res = response.responses[idx];
            return res.error?.code === 'messaging/invalid-registration-token' ||
                res.error?.code === 'messaging/registration-token-not-registered';
        });

        if (failedTokens.length) {
            await FCMToken.deleteMany({ token: { $in: failedTokens } });
            console.warn(`Removed ${failedTokens.length} invalid FCM tokens.`);
        }
    }
};

/**
 * Triggers property notification via Firebase Cloud Messaging.
 */
export const triggerPropertyNotification = async (property) => {
    try {
        const tokens = await FCMToken.find().select("token -_id");
        const tokenList = tokens.map(t => t.token);
        if (!tokenList.length) return;

        const { message, payload, imageUrl } = buildPayload(property);

        await saveNotificationToDB(message, imageUrl, property._id);
        await sendToTokenChunks(tokenList, payload);

        console.log(`✅ Notification sent for property ${property._id}`);
    } catch (err) {
        console.error("❌ Failed to trigger FCM notification:", err.message);
    }
};
