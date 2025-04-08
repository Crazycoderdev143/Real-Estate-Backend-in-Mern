import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        imageUrl: { type: String },
        url: { type: String, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        message: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
