import { genOtpForRegistration, verifyOtpAndRegistration, signUpUserWithGoogle, login, forgetPassword, resetPassword, deleteAccount, updateProfile } from "../controllers/authController.js";
import { getAllProperties, getProperty, addComment, getAllComment, contact, addToCart, getCartItems, removeFromCart, registerFCMToken, searchProperties, getAgents, feedback } from "../controllers/userController.js";
import { signupValidation, loginValidation, updateValidation, handleValidationErrors } from "../middlewares/validation.js"
import { rateLimiter } from '../middlewares/rateLimiterMiddleware.js';
import { uploadProfileImage } from "../middlewares/handleImages.js";
import authMiddleware from "../middlewares/verifyAuthentication.js";
import { getFeedbacks } from "../controllers/adminController.js";
import { loginLimiter } from '../middlewares/reqLimiter.js';
import { isUser } from "../middlewares/checkRole.js";
import express from "express";

const router = express.Router();


// // Route for send csrf-token to client
// router.get("/csrf-token", (req, res) => {
//     res.json({ csrfToken: req.csrfToken() });
// });

// Route for generate otp for verify user to registration
router.post("/gen-otp", signupValidation, loginLimiter, handleValidationErrors, genOtpForRegistration);

// Route for verify otp and save user in database
router.post("/verify-registration", signupValidation,  handleValidationErrors, verifyOtpAndRegistration);

// Route for user login
router.post("/login", loginValidation, loginLimiter, rateLimiter(), handleValidationErrors, login);

// Route for user login
router.post("/googlesignup", loginLimiter, signUpUserWithGoogle);

// Route for user forget password by sending mail
router.post("/forget-password", loginLimiter, rateLimiter(), forgetPassword);

// Route for user reset password by verify resetToken
router.put('/reset-password/:resetToken', loginLimiter, resetPassword);

// Route for user delete your account
router.delete('/deleteaccount', authMiddleware, isUser, deleteAccount);

// Route for user udate your details
router.put('/updateprofile/:userId', authMiddleware, isUser, uploadProfileImage, updateValidation, handleValidationErrors, updateProfile);

// Route get details of Property
router.get('/property/:propertyId', getProperty);

// Route add comment at Property
router.post('/property/comment/:userId', authMiddleware, isUser, addComment);

// Route get all comment of Property
router.get('/property/comment/:propertyId', getAllComment);

// Route for contact anyone
router.post('/contact', contact);

//Route for add item to cart
router.post("/addtocart/:userId", authMiddleware, isUser, addToCart);

//Route for get all item to the cart
router.get("/cartitems/:userId", authMiddleware, isUser, getCartItems);

//Route for get all item to the cart
router.delete("/remove-property/:userId", authMiddleware, isUser, removeFromCart);

//Route for register FCM token
router.post("/reg-notify-token", registerFCMToken);

// Route for user get all Property
router.get('/search', searchProperties);

// Route for user get all Agents
router.get('/agents', getAgents);

// Route for user send feedback
router.post('/feedback', feedback);

// Route for user get all Property
router.get('/feedbacks', getFeedbacks);

// Route for user get all Property
router.get('/', getAllProperties);




export default router;
