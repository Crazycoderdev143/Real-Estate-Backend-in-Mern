import { handleError } from '../middlewares/errorHandler.js';
import redisClient from '../services/redisClient.js';
import FCMToken from '../models/FCMTokenModel.js';
import CartItem from '../models/cartItemModel.js';
import Property from "../models/PropertyModel.js";
import Feedback from "../models/FeedbackModel.js";
import Contact from '../models/contactModel.js';
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import mongoose from 'mongoose';


// Get all properties (with Redis caching)
export const getAllProperties = async (req, res, next) => {
    try {
        const cacheKey = 'properties:all';
        const cachedProperties = await redisClient.get(cacheKey);

        if (cachedProperties) {
            return res.status(200).json({
                message: "All Properties fetched successfully (from cache).",
                success: true,
                properties: JSON.parse(cachedProperties)
            });
        }

        const properties = await Property.find();
        if (!properties.length) {
            return res.status(404).json({ message: "No properties found.", success: false });
        }

        // Store in cache for 30 minutes
        await redisClient.setex(cacheKey, 60 * 30, JSON.stringify(properties));

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

// Get a single property (with Redis caching)
export const getProperty = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ message: 'Invalid Property ID format.', success: false });
        }

        const cacheKey = `property:${propertyId}`;
        const cachedProperty = await redisClient.get(cacheKey);

        if (cachedProperty) {
            return res.status(200).json({
                message: "Property fetched successfully (from cache).",
                success: true,
                property: JSON.parse(cachedProperty)
            });
        }

        const property = await Property.findById(propertyId);
        if (!property) {
            return res.status(404).json({ message: "Property not found.", success: false });
        }

        // Store in cache for 30 minutes
        await redisClient.setex(cacheKey, 60 * 30, JSON.stringify(property));

        res.status(200).json({
            message: "Property fetched successfully.",
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

// Add new comment (Invalidate cache)
export const addComment = async (req, res, next) => {
    const { userId } = req.params;
    const { content, propertyId, userAvatar, userName } = req.body;

    try {
        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId or propertyId.', success: false });
        }

        const newComment = new Comment({
            content,
            propertyRef: propertyId,
            user: { id: userId, avatar: userAvatar, name: userName }
        });

        const comment = await newComment.save();

        // Invalidate cached comments for this property
        await redisClient.del(`comments:${propertyId}`);

        res.status(200).json({
            message: "Commented successfully.",
            success: true,
            comment
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Get all comments for a property (with Redis caching)
export const getAllComment = async (req, res, next) => {
    try {
        const { propertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(propertyId)) {
            return res.status(400).json({ message: 'Invalid Property ID.', success: false });
        }

        const cacheKey = `comments:${propertyId}`;
        const cachedComments = await redisClient.get(cacheKey);

        if (cachedComments) {
            return res.status(200).json({
                message: "All comments fetched successfully (from cache).",
                success: true,
                comments: JSON.parse(cachedComments)
            });
        }

        const comments = await Comment.find({ propertyRef: propertyId });
        if (!comments.length) {
            return res.status(404).json({ message: "No comments found.", success: false });
        }

        // Store in cache for 30 minutes
        await redisClient.setex(cacheKey, 60 * 30, JSON.stringify(comments));

        res.status(200).json({
            message: "All comments fetched successfully.",
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

// Send contact form (No need for caching)
export const contact = async (req, res, next) => {
    try {
        const { name, email, message, phone } = req.body;

        const newContact = new Contact({ name, email, message, phone });
        const contact = await newContact.save();

        res.status(201).json({
            message: "Contact sent successfully.",
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

// Add property to cart
export const addToCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { propertyId, propertyName, coverImg, regularPrice, discountPrice } = req.body;

        if (!userId || !propertyId || !propertyName || !coverImg || !regularPrice || !discountPrice) {
            return res.status(400).json({
                message: "All fields are required.",
                success: false,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId or propertyId.', success: false });
        }

        const existingItem = await CartItem.findOne({ userId, propertyId });
        if (existingItem) {
            return res.status(400).json({
                message: "Item already in cart.",
                success: false,
            });
        }

        const newCartItem = new CartItem({ userId, propertyId, propertyName, coverImg, regularPrice, discountPrice });
        const cartItem = await newCartItem.save();

        res.status(201).json({
            message: "Property added to cart successfully.",
            success: true,
            cartItem,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Get all cart property (with Redis caching)
export const getCartItems = async (req, res, next) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid Property ID.', success: false });
        }

        const cartItems = await CartItem.find({ userId });
        if (!cartItems) {
            return res.status(404).json({ message: "Property not found.", success: false });
        }

        res.status(200).json({
            message: "All cart items fetched successfully.",
            success: true,
            cartItems
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Remove property from cart
export const removeFromCart = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { propertyId } = req.body;

        if (!userId || !propertyId) {
            return res.status(400).json({
                message: "User ID and Property ID are required.",
                success: false,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(propertyId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid userId or propertyId.', success: false });
        }

        const cartItem = await CartItem.findOne({ userId, propertyId });
        if (!cartItem) {
            return res.status(404).json({
                message: "Property not found in cart.",
                success: false,
            });
        }

        await cartItem.deleteOne()

        res.status(200).json({
            message: "Property removed from cart successfully.",
            success: true,
        });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Register FCM Token
export const registerFCMToken = async (req, res, next) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ success: false, message: "Token is required" });
    }

    try {
        const existingToken = await FCMToken.findOne({ token });
        if (existingToken) {
            return res.status(409).json({ success: false, message: "This token has already registerd" });
        }
        const newToken = new FCMToken({ token });
        await newToken.save();

        res.status(201).json({ success: true, message: "Token registered" });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get property by search query
export const searchProperties = async (req, res, next) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ success: false, message: "Search query is required." });
        }

        // Search in title and description using case-insensitive regex
        const properties = await Property.find({
            $or: [
                { title: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
            ],
        })
            .limit(20) // Limit the results for efficiency
            .select("title type imageUrls regularPrice city state"); // Select only required fields

        res.status(200).json({ success: true, message: `Fetch matched property by ${query}`, properties });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// get property by search query
export const getAgents = async (req, res, next) => {
    try {
        const agent = "Agent";

        // Search in title and description using case-insensitive regex
        const agents = await User.find({
            $or: [
                { role: { $regex: agent, $options: "i" } },
            ],
        })
            // .limit(20) // Limit the results for efficiency
            .select("username phone email profileImage"); // Select only required fields

        res.status(200).json({ success: true, message: `Fetch all agent Users`, agents });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};

// Get feedback from from users
export const feedback = async (req, res, next) => {
    try {
        const { rating, comment, userId, username } = req.body;

        // Validate rating (should be between 1 and 5)
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Invalid rating value.", success: false });
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid or missing userId.", success: false });
        }

        // Validate comment (should be at least 3 characters long)
        if (!comment || comment.trim().length < 3) {
            return res.status(400).json({ message: "Comment must be at least 3 characters.", success: false });
        }

        // Save feedback
        const feedback = new Feedback({ userId, rating, comment, username });
        await feedback.save();

        return res.status(201).json({ message: "Feedback submitted successfully", success: true });
    } catch (error) {
        if (!res.headersSent) {
            return handleError(req, res, error);
        }
        next(error);
    }
};