import mongoose from "mongoose";
const { Schema } = mongoose;

const CartItemSchema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User",
            index: true,
        },
        propertyId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Property",
            index: true,
        },
        propertyName: {
            type: String,
            required: true,
        },
        coverImg: {
            type: String,
            required: true,
        },
        regularPrice: {
            type: Number,
            required: true,
        },
        discountPrice: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);


export default mongoose.model("CartItem", CartItemSchema);
