import mongoose from "mongoose";
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        user: {
            type: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
                avatar: {
                    type: String,
                    default:
                        "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwDrsJA7KULLY2CmTumjKH4-ywJ7SXxaXhgY9xobv13ufFWsR5",
                },
            },
            required: true,
        },
        propertyRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property",
            required: true,
        },
    },
    { timestamps: true }
);


export default mongoose.model("Comment", CommentSchema);
