import { recordFailedAttempt, resetFailedAttempts } from '../utils/authUtils.js';
import { uploadSingleImageOnCloudinary } from "../services/cloudinary.js";
import { createTokenForUser } from "../services/authentication.js";
import { handleError } from "../middlewares/errorHandler.js";
import { sendEmail } from "../services/nodeMailer.js";
import User from "../models/userModel.js";
import OTP from "../models/otp.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";


// Genrate OTP for Registration Route
export const genOtpForRegistration = async (req, res, next) => {
    try {
        const { username, email, role } = req.body;

        // Check if email or username already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username, role }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with the given credentials already exists." });
        }

        if (!["User", "Agent", "Admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid role specified." });
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedOtp = await bcrypt.hash(otp, 12);

        // Store OTP in the database
        await OTP.create({
            email,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
        });
        const subject = "Your OTP for Registration";
        const html = `Your OTP is: ${otp}. It is valid for 10 minutes.`;

        const emailResponce = await sendEmail(email, subject, html)
        if (emailResponce) {
            res.status(200).json({
                message: "OTP sent to your email. Please verify to complete registration.",
                success: true,
            });
        }
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Verify OTP and save user in database
export const verifyOtpAndRegistration = async (req, res, next) => {
    try {
        const { username, otp, email, password, role, phone } = req.body;

        // Find the OTP entry in the database
        const otpEntry = await OTP.findOne({ email });
        if (!otpEntry) {
            return res.status(400).json({ message: "OTP not found or has expired.", success: false });
        }

        // Check if OTP is valid
        const isOtpValid = await bcrypt.compare(otp, otpEntry.otp);
        if (!isOtpValid) {
            return res.status(400).json({ message: "Invalid OTP.", success: false });
        }

        if (Date.now() > new Date(otpEntry.expiresAt)) {
            await OTP.deleteOne({ email }); // Remove expired OTP
            return res.status(400).json({ message: "OTP has expired.", success: false });
        }

        // Hash the password (async version)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create a new user
        const newUser = new User({ username, email, password: hashedPassword, role, phone });
        const user = await newUser.save(); // Save to the database

        // Generate a JWT
        const token = createTokenForUser(user);

        await OTP.deleteOne({ email }); // Delete OTP after successfully registration

        res.cookie("access_token", `Bearer ${token}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
        }).status(201).json({
            message: "User Created Successfully.",
            access_token: `Bearer ${token}`,
            user_info: user,
            success: true
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};

//user signUp with google accounts
export const signUpUserWithGoogle = async (req, res, next) => {
    try {
        const { username, email, password, role, phone } = req.body;

        // Check if the email already exists
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            return res.status(409).json({
                message: "Email already exist. Please try another email!",
                success: false
            });
        }
        // Check if the username already exists
        const existingUsername = await User.findOne({ username, role });
        if (existingUsername) {
            return res.status(409).json({
                message: "Username already exist.",
                success: false
            });
        }

        // Hash the password (async version)
        const hashedPassword = await bcrypt.hash(password, 12);

        // Handle profile image upload (using multer)
        let profileImage;
        if (req.file) {
            // The profile image upload on cloudinary
            const uploadResult = await uploadSingleImageOnCloudinary(req.file.path)
            profileImage = uploadResult.url; // Save the file url in the user profile
        }

        // Create a new user
        const newUser = new User({ username, email, password: hashedPassword, profileImage, role, phone });

        if (!["User", "Agent", "Admin"].includes(role)) {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }
        const user = await newUser.save(); // Save to the database

        res.status(201).json({
            message: "Otp sent Successfully.",
            success: true,
            user
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};

// user Login
export const login = async (req, res, next) => {
    try {
        const { usernameOrEmail, password } = req.body;

        // Find the user by username or email
        const user = usernameOrEmail.includes("@")
            ? await User.findOne({ email: usernameOrEmail })
            : await User.findOne({ username: usernameOrEmail });

        if (!user) {
            await recordFailedAttempt(usernameOrEmail);
            return res.status(404).json({
                message: "User account not found with the given credentials.",
                success: false
            });
        }

        // Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            await recordFailedAttempt(usernameOrEmail);
            return res.status(401).json({
                message: "Invalid credential.",
                success: false
            });
        }
        // Generate a JWT
        const token = createTokenForUser(user);
        await recordFailedAttempt(usernameOrEmail);

        res.cookie("access_token", `Bearer ${token}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
        }).status(200).json({
            message: "Login Successfully.",
            access_token: `Bearer ${token}`,
            user_info: user,
            success: true
        });

    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};

// Forgot Password Endpoint
export const forgetPassword = async (req, res, next) => {
    try {
        // Check if the user exists in the database
        const { usernameOrEmail } = req.body;

        // Find the user by username or email
        let user = usernameOrEmail.includes("@")
            ? await User.findOne({ email: usernameOrEmail })
            : await User.findOne({ username: usernameOrEmail });

        if (!user) {
            await recordFailedAttempt(usernameOrEmail);
            return res.status(404).json({
                message: "User account not found with the given credentials.",
                success: false
            });
        }

        // Generate a password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Store the hashed reset token in the database with an expiration date
        user.passwordResetToken = resetTokenHash;
        user.passwordResetTokenExpiration = Date.now() + 3600000; // 1 hour expiration
        user = await user.save();
        await resetFailedAttempts(usernameOrEmail);


        // Send the reset password email with the reset token
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        const subject = 'Password Reset Request';
        const html = `
            <p>Hello ${user.username || user.email},</p>
            <p>You requested a password reset. Click the link below to reset your password:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email.</p>
        `;
        const emailResponce = await sendEmail(user.email, subject, html)
        if (emailResponce) {
            res.status(200).json({ message: 'Sent an mail on your email address for reset the password', success: true });
        }
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};

// Reset Password Endpoint
export const resetPassword = async (req, res, next) => {
    try {
        const { resetToken } = req.params;
        const { newPassword } = req.body;
        // Find the user by the reset token hash
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const user = await User.findOne({ passwordResetToken: resetTokenHash, passwordResetTokenExpiration: { $gt: Date.now() } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid or expired token', success: false });
        }

        // Hash the new password and save it to the user's record
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        user.password = hashedPassword;
        user.passwordResetToken = undefined; // Clear the reset token
        user.passwordResetTokenExpiration = undefined; // Clear the expiration date
        await user.save();

        return res.status(200).json({ message: 'Password has been successfully reset', success: true });

    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};

// Delete user Account
export const deleteAccount = async (req, res, next) => {
    try {
        const { userId } = req.body;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid userId ID format.',
                success: false,
            });
        }
        // find user exist or not
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not exist!",
                success: false
            });
        }
        await user.deleteOne()
        res.status(200).json({
            message: "User Account Deleted Successfully.",
            success: true
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
}

// Profile update function
export const updateProfile = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { username, email, password, phone } = req.body;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid userId ID format.',
                success: false,
            });
        }

        // Fetch the existing user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found.",
                success: false,
            });
        }

        // Check if email is changing and already exists for another user
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(409).json({
                    message: "Email already exists. Please try another email!",
                    success: false,
                });
            }
            user.email = email; // Update email
        }

        // Check if username is changing and already exists for another user
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(409).json({
                    message: "Username already exists.",
                    success: false,
                });
            }
            user.username = username; // Update username
        }

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 12);
            user.password = hashedPassword;
        }
        user.phone = phone; // Update phone if provided

        // Handle profile image upload (using multer)
        if (req.file) {
            // The profile image upload on cloudinary
            const uploadResult = await uploadSingleImageOnCloudinary(req.file.path)
            user.profileImage = uploadResult.url; // Save the file url in the user profile
        }

        const updatedUser = await user.save();// Save the updated user to the database
        const token = createTokenForUser(updatedUser); // Generate a JWT

        res.cookie("access_token", `Bearer ${token}`, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: "strict",
        }).status(200).json({
            message: "Profile updated successfully.",
            access_token: `Bearer ${token}`,
            user_info: updatedUser,
            success: true
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error); // Pass error to centralized error handler
    }
};
