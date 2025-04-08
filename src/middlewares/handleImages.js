import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; // Import to define __dirname

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const parentDir = path.join(__dirname, '..');


// Ensure uploads directory exists
const ensureUploadsDirectory = () => {
    const dir = path.join(parentDir, './public/images');
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Setup multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        ensureUploadsDirectory()
        return cb(null, './public/images'); // save files in the 'public/images' directory
    },
    filename: function (req, file, cb) {
        return cb(null, `Sdky ${Date.now()}- ${file.originalname}`) // unique filename
        // return cb(null, `Sdky ${Date.now()}- ${path.extname(file.originalname)}`) // unique filename with extension
    },
});

// Filter for allowed file types (optional)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
};

// Create multer instance
const upload = multer({ storage, fileFilter });

// Single image upload (for profile images)
export const uploadProfileImage = upload.single('profileImage');  // 'profileImage' is the field name

// Single image upload (for notification icon images)
export const uploadNotificationImage = upload.single('notificationImage');  // 'notificationImage' is the field name

// Multiple image upload (for property images)
export const uploadPropertyImages = upload.array('propertyImages', 10);  // Max 10 files for 'propertyImages'

// // Mixed single + multiple field uploads
// export const uploadMixedImages = upload.fields([
//     { name: 'profileImage', maxCount: 1 },   // Single file for profile
//     { name: 'propertyImages', maxCount: 6 }  // Up to 6 files for properties
// ]);



////////////////////////// Error Handling //////////////////////////

// Error handler middleware
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Handle multer-specific errors
        return res.status(400).json({ error: err.message });
    } else if (err) {
        // Handle other errors
        return res.status(500).json({ error: 'File upload failed', details: err.message });
    }
    next();
};
