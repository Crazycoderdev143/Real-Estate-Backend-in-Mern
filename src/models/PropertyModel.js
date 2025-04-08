import mongoose from "mongoose";
const { Schema } = mongoose;

const PropertySchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        imageUrls: {
            type: [String],
            required: true,
            validate: {
                validator: (arr) => arr.length > 0,
                message: "At least one image URL is required.",
            },
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        dimensions: {
            sqft: { type: Number, required: true, min: 0 },
        },
        owner: {
            name: { type: String, required: true, trim: true },
            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                match: [/.+@.+\..+/, "Invalid email address"],
            },
            phone: {
                type: String,
                required: true,
                validate: {
                    validator: (v) => /^[0-9]{10}$/.test(v),
                    message: "Phone must be a valid 10-digit number",
                },
            },
        },
        type: {
            type: String,
            required: true,
            trim: true,
        },
        regularPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        discountPrice: {
            type: Number,
            required: true,
            min: 0,
            validate: {
                validator: function (v) {
                    return v <= this.regularPrice;
                },
                message: "Discount price must be less than or equal to regular price",
            },
        },
        bathrooms: {
            type: Number,
            required: true,
            min: 0,
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 0,
        },
        furnished: {
            type: Boolean,
            default: false,
        },
        parking: {
            type: Boolean,
            default: false,
        },
        rent: {
            type: Boolean,
            default: false,
        },
        sell: {
            type: Boolean,
            default: false,
        },
        buy: {
            type: Boolean,
            default: false,
        },
        offer: {
            type: Boolean,
            default: false,
        },
        userRef: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);


export default mongoose.model("Property", PropertySchema);
