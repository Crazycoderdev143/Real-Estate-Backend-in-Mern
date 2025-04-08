import { addNewProperty, updateProperty, deleteProperty, getAllProperties, getAllUsers, getUser, deleteUser, addNewUser, updateUser, getAllContact, getContact, deleteContact, getAllComment, sendNotification, getFeedbacks, deleteFeedback } from "../controllers/adminController.js";
import { genOtpForRegistration, verifyOtpAndRegistration, login, forgetPassword, resetPassword, deleteAccount, updateProfile } from "../controllers/authController.js";
import { uploadProfileImage, uploadPropertyImages, uploadNotificationImage, handleUploadError } from "../middlewares/handleImages.js";
import { signupValidation, loginValidation, updateValidation } from "../middlewares/validation.js"
import { getProperty } from "../controllers/userController.js";
// import { rateLimiter } from '../middlewares/rateLimiterMiddleware.js';
import express from "express";


const router = express.Router();

// // Route for generate otp for verify user to registration
// router.post("/gen-otp", signupValidation, genOtpForRegistration);

// // Route for verify otp and save user in database
// router.post("/verify-registration", signupValidation, verifyOtpAndRegistration);

// // Route for admin login
// router.post("/login", loginValidation, login);

// // Route for admin forget password by sending mail
// router.post("/forget-password", forgetPassword);

// // Route for admin reset password by verify resetToken
// router.put('/reset-password/:resetToken', resetPassword);

// Route for admin delete your account
router.delete('/deleteaccount', deleteAccount);

// Route for admin update your details
router.put('/updateprofile/:userId', uploadProfileImage, handleUploadError, updateValidation, updateProfile);

// Route for admin add new Property in list
router.post('/add-new-property/:userRef', uploadPropertyImages, handleUploadError, addNewProperty);

// Route for admin add new user in list
router.post('/add-new-user', uploadProfileImage, handleUploadError, signupValidation, addNewUser);

// Route for admin update Property details of existing Property
router.put('/update-property/:propertyId', uploadPropertyImages, handleUploadError, updateProperty);

// Route for admin update user details of existing user
router.put('/update-user/:userId', uploadProfileImage, handleUploadError, updateValidation, updateUser);

// Route for admin get details of Property 
router.get('/property/:propertyId', getProperty);

// Route for admin get details of user
router.get('/user/:userId', getUser);

// Route for admin delete your account
router.delete('/delete-property/:propertyId', deleteProperty);

// Route for admin delete user
router.delete('/delete-user/:userId', deleteUser);

// Route for admin delete user
router.delete('/delete-contact/:contactId', deleteContact);

// Route for admin fetch all Properties
router.get('/properties', getAllProperties);

// Route for admin fetch all users
router.get('/users', getAllUsers);

// Route for admin fetch all contacts
router.get('/contacts', getAllContact);

// Route for admin fetch all comments
router.get('/comments', getAllComment);

// Route for admin fetch all feedback
router.get('/feedbacks', getFeedbacks);

// Route for admin delete feedback
router.delete('/delete-feedback/:feedbackId', deleteFeedback);

// Route for admin fetch all contacts
router.get('/contact/:contactId', getContact);

// Route for admin send notification
router.post('/send-notification', uploadNotificationImage, handleUploadError, sendNotification);



export default router;
