import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
}, { timestamps: true }
);



export default mongoose.model("Feedback", feedbackSchema);
