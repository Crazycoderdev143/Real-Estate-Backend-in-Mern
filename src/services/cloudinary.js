import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();  // <-- Add this to load .env variables

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Single Image Upload to Cloudinary
const uploadSingleImageOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) throw new Error("File path not found");

        const uploadResult = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto" });

        fs.unlinkSync(localFilePath);  // Delete local file after successful upload
        return uploadResult;
    } catch (error) {
        // Only delete if the file exists
        if (fs.existsSync(localFilePath)) {
            try {
                fs.unlinkSync(localFilePath);  // Cleanup
            } catch (unlinkError) {
                console.error("Failed to delete local file after error:", unlinkError);
            }
        }
        console.error("Error uploading to Cloudinary:", error);
        throw error;
    }
};

// Multiple Image Upload to Cloudinary
const uploadMultipleImagesOnCloudinary = async (localFilePaths) => {
    try {
        if (!localFilePaths || localFilePaths.length === 0) throw new Error("No files to upload");

        const uploadPromises = localFilePaths.map(async (path) => {
            const uploadResult = await cloudinary.uploader.upload(path, { resource_type: "auto" });
            fs.unlinkSync(path);  // Delete local file after upload
            return uploadResult;
        });

        const uploadResults = await Promise.all(uploadPromises);
        return uploadResults;
    } catch (error) {
        localFilePaths.forEach((path) => {
            if (fs.existsSync(path)) {
                try {
                    fs.unlinkSync(path);
                } catch (unlinkError) {
                    console.error(`Failed to delete ${path} after error:`, unlinkError);
                }
            }
        });
        console.error("Error uploading multiple files to Cloudinary:", error);
        return error;
    }
};

export { uploadSingleImageOnCloudinary, uploadMultipleImagesOnCloudinary };
