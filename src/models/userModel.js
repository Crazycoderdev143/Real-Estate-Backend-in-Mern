import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, "Please use a valid email address"],
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            // select: false, // Security: Exclude password from queries by default
        },
        profileImage: {
            type: String,
            default:
                "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQwDrsJA7KULLY2CmTumjKH4-ywJ7SXxaXhgY9xobv13ufFWsR5",
        },
        passwordResetToken: {
            type: String,
            select: false, // Security: Not usually needed in queries
        },
        passwordResetTokenExpiration: {
            type: Date,
            select: false,
        },
        role: {
            type: String,
            enum: ["User", "Agent", "Admin"],
            default: "User",
        },
        lastLogin: {
            type: Date,
            default: Date.now,
        },
        phone: {
            type: String,
            required: true,
            validate: {
                validator: (v) => /^[0-9]{10}$/.test(v),
                message: "Phone number must be 10 digits",
            },
        },
    },
    { timestamps: true }
);


export default mongoose.model("User", UserSchema);
