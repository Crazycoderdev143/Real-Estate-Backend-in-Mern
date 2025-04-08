import { uploadMultipleImagesOnCloudinary, uploadSingleImageOnCloudinary } from "../services/cloudinary.js";
import { triggerPropertyNotification } from "../utils/sendFCMNotification.js"
import { handleError } from "../middlewares/errorHandler.js";
import firebaseAdmin from '../services/firebaseAdmin.js';
import Notification from '../models/notificationModel.js';
import redisClient from '../services/redisClient.js';
import FCMToken from '../models/FCMTokenModel.js';
import Feedback from '../models/FeedbackModel.js';
import Property from "../models/propertyModel.js";
import Comment from "../models/commentModel.js";
import Contact from "../models/contactModel.js";
import User from "../models/userModel.js";
import mongoose from 'mongoose';
import bcrypt from "bcryptjs";




// add new Property
export const addNewProperty = async (req, res, next) => {
    try {
        const { userRef } = req.params;
        if (!mongoose.Types.ObjectId.isValid(userRef)) {
            return res.status(400).json({
                message: 'Invalid userRef ID format.',
                success: false,
            });
        }

        const { title, description, regularPrice, discountPrice, bathrooms, bedrooms, furnished, parking, type,
            offer, rent, sell, buy, city, state, country, sqft, name, email, phone } = req.body;

        console.log("req.body", req.body)

        if (!title || !description || !regularPrice || !type) {
            return res.status(400).json({
                message: "Missing required fields: title, description, regularPrice, type are mandatory.",
                success: false
            });
        }

        const existingProperty = await Property.findOne({ title });
        if (existingProperty) {
            return res.status(409).json({
                message: "This Property name already exists. Choose another name.",
                success: false
            });
        }

        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            const filesPath = req.files.map(file => file.path);
            const uploadResults = await uploadMultipleImagesOnCloudinary(filesPath);

            if (!Array.isArray(uploadResults)) {
                return res.status(502).json({
                    message: "Image upload failed. Please try again.",
                    error: uploadResults.message || "Unknown error during image upload",
                    success: false
                });
            }

            imageUrls = uploadResults.map(imageUrl => imageUrl.secure_url);
        }

        const newProperty = new Property({
            title, description, regularPrice, discountPrice, bathrooms, bedrooms, furnished, parking, type, imageUrls,
            offer, rent, sell, buy, city, state, country, dimensions: { sqft }, owner: { name, email, phone }, userRef
        });
        const property = await newProperty.save();

        await redisClient.del("properties");

        // 🟢 Trigger Notification
        await triggerPropertyNotification(property);

        res.status(201).json({
            message: "Property Created Successfully.",
            success: true,
            property
        });

    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// update Property details
export const updateProperty = async (req, res, next) => {
    try {

        const { propertyId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({
                message: "Invalid Property ID format.",
                success: false,
            });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
                success: false,
            });
        }

        const {
            title, description, regularPrice, discountPrice, bathrooms, bedrooms, furnished, parking, type,
            offer, rent, sell, buy, city, state, country, sqft, name, email, phone, propertyImages
        } = req.body;

        if (!title?.trim() || !description?.trim() || !regularPrice || !type?.trim()) {
            return res.status(400).json({
                message: "Missing required fields: title, description, regularPrice, and type are mandatory.",
                success: false,
            });
        }

        const existingProperty = await Property.findOne({ title: title.trim(), _id: { $ne: propertyId } });
        if (existingProperty) {
            return res.status(409).json({
                message: "This Property name already exists. Choose another name.",
                success: false,
            });
        }

        let cloudinaryUrls = [];
        if (req.files?.length > 0) {
            const filesPath = req.files.map(file => file.path);
            const uploadResults = await uploadMultipleImagesOnCloudinary(filesPath);
            cloudinaryUrls = uploadResults.map(image => image.url);
        }

        const finalImages = [...new Set([...(propertyImages?.length > 1 ? propertyImages : [propertyImages]), ...cloudinaryUrls])]; // Remove duplicates

        Object.assign(property, {
            title: title.trim(),
            description: description.trim(),
            regularPrice,
            discountPrice,
            dimensions: { sqft },
            bathrooms,
            bedrooms,
            furnished,
            parking,
            imageUrls: finalImages,
            country,
            state,
            city,
            type: type.trim(),
            offer,
            rent,
            sell,
            buy,
            owner: {
                name: name?.trim() || property.owner.name,
                email: email?.trim() || property.owner.email,
                phone: phone?.trim() || property.owner.phone,
            }
        });

        const updatedProperty = await property.save();

        // Uncomment if using Redis for caching
        await redisClient.del(`properties`);
        await redisClient.del(`property:${propertyId}`);

        return res.status(200).json({
            message: "Property Updated Successfully.",
            success: true,
            property: updatedProperty,
        });

    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

export const deleteProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const { userRef } = req.body;

        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userRef)) {
            return res.status(400).json({
                message: 'Invalid Property or userRef ID format.',
                success: false,
            });
        }

        const property = await Property.findOne({ userRef, _id: propertyId });
        if (!property) {
            return res.status(404).json({
                message: "Property not found.",
                success: false
            });
        }

        await property.deleteOne();
        await redisClient.del("properties");
        await redisClient.del(`property:${propertyId}`);

        res.status(200).json({
            message: "Property Deleted Successfully.",
            success: true,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get all Properties
export const getAllProperties = async (req, res, next) => {
    try {
        // Check Redis cache first
        const cachedProperties = await redisClient.get("properties");
        if (cachedProperties) {
            return res.status(200).json({
                message: "All Properties fetched successfully from cache.",
                success: true,
                properties: JSON.parse(cachedProperties)
            });
        }

        // Fetch from database if not in cache
        const properties = await Property.find();
        if (!properties) {
            return res.status(404).json({
                message: "Properties not found",
                success: false
            });
        }

        // Store in Redis cache with expiration (1 hour)
        await redisClient.setex("properties", 3600, JSON.stringify(properties));

        res.status(200).json({
            message: "All Properties fetched successfully.",
            success: true,
            properties
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get all Users
export const getAllUsers = async (req, res, next) => {
    try {
        // Check Redis cache first
        const cachedUsers = await redisClient.get("users");
        if (cachedUsers) {
            return res.status(200).json({
                message: "All Users fetched successfully from cache.",
                success: true,
                users: JSON.parse(cachedUsers)
            });
        }

        // Fetch from database if not in cache
        const users = await User.find();
        if (!users) {
            return res.status(404).json({
                message: "Users not found",
                success: false
            });
        }

        // Store in Redis cache with expiration (1 hour)
        await redisClient.setex("users", 3600, JSON.stringify(users));

        res.status(200).json({
            message: "All Users fetched successfully.",
            success: true,
            users
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get user details
export const getUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid userId ID format.',
                success: false,
            });
        }

        // Check Redis cache first
        const cachedUser = await redisClient.get(`user:${userId}`);
        if (cachedUser) {
            return res.status(200).json({
                message: "User fetched successfully from cache.",
                success: true,
                user: JSON.parse(cachedUser)
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        // Store in Redis cache with expiration (1 hour)
        await redisClient.setex(`user:${userId}`, 3600, JSON.stringify(user));

        res.status(200).json({
            message: "User fetched successfully.",
            success: true,
            user
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// add new user
export const addNewUser = async (req, res, next) => {
    try {
        const { username, email, password, role, phone } = req.body;

        // Check Redis cache for existing email
        const cachedEmail = await redisClient.get(`email:${email}`);
        if (cachedEmail) {
            return res.status(409).json({
                message: "Email already exists in cache. Please try another email!",
                success: false
            });
        }

        // Check if the email already exists in DB
        const existingEmail = await User.findOne({ email });
        if (existingEmail) {
            // Cache the email to avoid redundant checks in a short period
            await redisClient.setex(`email:${email}`, 60 * 15, "exists"); // Cache for 15 minutes
            return res.status(409).json({
                message: "Email already exists. Please try another email!",
                success: false
            });
        }

        // Check Redis cache for existing username
        const cachedUsername = await redisClient.get(`username:${username}:${role}`);
        if (cachedUsername) {
            return res.status(409).json({
                message: "Username already exists in cache.",
                success: false
            });
        }

        // Check if the username already exists in DB
        const existingUsername = await User.findOne({ username, role });
        if (existingUsername) {
            // Cache the username to avoid redundant checks in a short period
            await redisClient.setex(`username:${username}:${role}`, 60 * 15, "exists"); // Cache for 15 minutes
            return res.status(409).json({
                message: "Username already exists.",
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
            message: "User Created Successfully.",
            success: true,
            user
        });
    } catch (error) {
        handleError(req, res, error)
        next(error); // Pass error to centralized error handler
    }
};

// Update User
export const updateUser = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { username, email, password, role, phone } = req.body;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid userId ID format.',
                success: false,
            });
        }

        // Check Redis cache for user data
        let user = await redisClient.get(`user:${userId}`);
        if (user) {
            user = JSON.parse(user);
        } else {
            // Fetch from database if not cached
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    message: "User not found.",
                    success: false,
                });
            }
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

        // Update role, phone
        if (role && role !== user.role) user.role = role;
        if (phone) user.phone = phone;

        // Update password if provided
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 12);
            user.password = hashedPassword;
        }

        // Handle profile image upload
        if (req.file) {
            const uploadResult = await uploadSingleImageOnCloudinary(req.file.path);
            user.profileImage = uploadResult.url;
        }

        // Save the updated user to the database
        const updatedUser = await user.save();

        // // Invalidate and update Redis cache
        await redisClient.del(`user:${userId}`);
        await redisClient.setex(`user:${userId}`, 60 * 30, JSON.stringify(updatedUser)); // Cache for 30 minutes

        res.status(200).json({
            message: "User Updated Successfully.",
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Delete User
export const deleteUser = async (req, res, next) => {
    try {
        const { userId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: 'Invalid userId ID format.',
                success: false,
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found",
                success: false
            });
        }

        await user.deleteOne();

        // // Remove user from Redis cache
        await redisClient.del(`user:${userId}`);

        res.status(200).json({
            message: "User Deleted successfully.",
            success: true,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get all Contacts
export const getAllContact = async (req, res, next) => {
    try {
        const cachedContacts = await redisClient.get("contacts");
        if (cachedContacts) {
            return res.status(200).json({
                message: "All Contacts fetched successfully from cache.",
                success: true,
                contacts: JSON.parse(cachedContacts)
            });
        }

        const contacts = await Contact.find();
        if (!contacts) {
            return res.status(404).json({
                message: "Contacts not found",
                success: false
            });
        }

        await redisClient.setex("contacts", 3600, JSON.stringify(contacts));

        res.status(200).json({
            message: "All Contacts fetched successfully.",
            success: true,
            contacts
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get all Comments
export const getAllComment = async (req, res, next) => {
    try {
        const cachedComments = await redisClient.get("comments");
        if (cachedComments) {
            return res.status(200).json({
                message: "All Comments fetched successfully from cache.",
                success: true,
                comments: JSON.parse(cachedComments)
            });
        }

        const comments = await Comment.find();
        if (!comments) {
            return res.status(404).json({
                message: "Comments not found",
                success: false
            });
        }

        await redisClient.setex("comments", 3600, JSON.stringify(comments));

        res.status(200).json({
            message: "All Comments fetched successfully.",
            success: true,
            comments
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get Contact details
export const getContact = async (req, res, next) => {
    try {
        const { contactId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({
                message: 'Invalid contactId ID format.',
                success: false,
            });
        }

        const cachedContact = await redisClient.get(`contact:${contactId}`);
        if (cachedContact) {
            return res.status(200).json({
                message: "Contact fetched successfully from cache.",
                success: true,
                contact: JSON.parse(cachedContact)
            });
        }

        const contact = await Contact.findById(contactId);
        if (!contact) {
            return res.status(404).json({
                message: "Contact not found",
                success: false
            });
        }

        await redisClient.setex(`contact:${contactId}`, 3600, JSON.stringify(contact));

        res.status(200).json({
            message: "Contact fetched successfully.",
            success: true,
            contact
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// delete contact
export const deleteContact = async (req, res, next) => {
    try {
        const { contactId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return res.status(400).json({
                message: 'Invalid contactId ID format.',
                success: false,
            });
        }

        // // Check Redis cache first
        let contact = await redisClient.get(`contact:${contactId}`);

        if (contact) {
            // If contact exists in Redis, parse it
            contact = JSON.parse(contact);
        } else {
            // If not in cache, fetch from database
            const contact = await Contact.findById(contactId);
            if (!contact) {
                return res.status(404).json({
                    message: "Contact not found",
                    success: false
                });
            }
        }

        // Delete contact from database
        await contact.deleteOne();

        // Invalidate the Redis cache
        await redisClient.del(`contact:${contactId}`);

        res.status(200).json({
            message: "Contact deleted successfully.",
            success: true,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Send Notification to All Users
export const sendNotification = async (req, res, next) => {
    const { type, title, message, url } = req.body;

    if (!title || !type || !message || !url) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        // Fetch all stored FCM tokens from MongoDB
        const tokens = await FCMToken.find().select("token -_id");
        const tokenList = tokens.map((t) => t.token);

        if (tokenList.length === 0) {
            return res.status(400).json({ success: false, message: "No registered tokens found" });
        }

        // Handle profile image upload (using multer)
        let imageUrl;
        if (req.file) {
            // The profile image upload on cloudinary
            const uploadResult = await uploadSingleImageOnCloudinary(req.file.path)
            imageUrl = uploadResult.url; // Save the file url in the user profile
        }

        const notification = new Notification({ type, title, message, imageUrl, url });
        await notification.save()// Save to the database

        // Define the FCM payload
        const payload = {
            notification: {
                title,
                body: message,
                image: imageUrl || undefined, // Optional: Only include image if it exists
            },
            data: {
                type,
                url,
                imageUrl: imageUrl || "", // Send empty string if no image
            }
        };

        // Batch processing for more than 500 tokens
        let responses = [];
        const chunkSize = 500;
        for (let i = 0; i < tokenList.length; i += chunkSize) {
            const chunk = tokenList.slice(i, i + chunkSize);
            const response = await firebaseAdmin.messaging().sendEachForMulticast({
                tokens: chunk,
                ...payload,
            });
            responses.push(response);
        }

        res.status(201).json({ success: true, message: "Notification sent successfully", responses });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Get all feedback (Admin)
export const getFeedbacks = async (req, res, next) => {
    try {
        const feedbacks = await Feedback.find().sort({ createdAt: -1 }).lean();
        res.status(200).json({ message: "Feedback fetch successfully", feedbacks, success: true });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// delete feedback
export const deleteFeedback = async (req, res, next) => {
    try {
        const { feedbackId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
            return res.status(400).json({
                message: 'Invalid feedbackId ID format.',
                success: false,
            });
        }

        // Check Redis cache first
        let feedback = await redisClient.get(`contact:${feedbackId}`);

        if (feedback) {
            // If feedback exists in Redis, parse it
            feedback = JSON.parse(feedback);
        } else {
            // If not in cache, fetch from database
            const feedback = await Feedback.findByIdAndDelete(feedbackId);
            if (!feedback) {
                return res.status(404).json({
                    message: "feedback not found",
                    success: false
                });
            }
        }

        // Invalidate the Redis cache
        await redisClient.del(`feedback:${feedbackId}`);

        res.status(200).json({
            message: "Feedback deleted successfully.",
            success: true,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};