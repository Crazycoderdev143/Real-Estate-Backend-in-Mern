import mongoose from "mongoose";
const { Schema } = mongoose;

const FCMTokenSchema = new Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            maxlength: 1024,
        },
        deviceType: {
            type: String,
            enum: ["web", "android", "ios"],
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
    },
    { timestamps: true }
);


export default mongoose.model("FCMToken", FCMTokenSchema);
