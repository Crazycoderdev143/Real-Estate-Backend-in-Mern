import { triggerPropertyNotification } from "../utils/sendFCMNotification.js"
import { uploadMultipleImagesOnCloudinary } from "../services/cloudinary.js";
import { handleError } from "../middlewares/errorHandler.js";
import redisClient from '../services/redisClient.js';
import Property from "../models/PropertyModel.js";
import Contact from "../models/contactModel.js";
import mongoose from 'mongoose';


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

        if (!title || !description || !regularPrice || !type) {
            return res.status(400).json({
                message: "Missing required fields: title, description, regularPrice, type and address are mandatory.",
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
            imageUrls = uploadResults.map(imageUrl => imageUrl.url);
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
        const properties = await Property.find().sort({ createdAt: -1 }).lean();
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
