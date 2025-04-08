import mongoose from "mongoose";
const { Schema } = mongoose;

const ContactSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            match: [/.+@.+\..+/, "Please use a valid email address"],
        },
        phone: {
            type: String,
            required: true,
            match: [/^\+?[0-9]{7,15}$/, "Please enter a valid phone number"],
        },
        message: {
            type: String,
            required: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);


export default mongoose.model("Contact", ContactSchema);
