import { addNewProperty, getAllProperties, getAllContact, getContact } from "../controllers/adminController.js";
import { genOtpForRegistration, verifyOtpAndRegistration, login, forgetPassword, resetPassword, deleteAccount, updateProfile } from "../controllers/authController.js";
import { uploadProfileImage, uploadPropertyImages, handleUploadError } from "../middlewares/handleImages.js";
import { signupValidation, loginValidation, updateValidation } from "../middlewares/validation.js"
import { getProperty, addToCart, getCartItems, removeFromCart } from "../controllers/userController.js";
// import { rateLimiter } from '../middlewares/rateLimiterMiddleware.js';
import express from "express";



const router = express.Router();


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

// Route for admin get details of Property 
router.get('/property/:propertyId', getProperty);

// Route for admin fetch all Properties
router.get('/properties', getAllProperties);

// Route for admin fetch all contacts
router.get('/contacts/', getAllContact);

// Route for admin fetch all contacts
router.get('/contact/:contactId', getContact);

//Route for add item to cart
router.post("/addtocart/:userId", addToCart)

//Route for get all item to the cart
router.get("/cartitems/:userId", getCartItems)

//Route for get all item to the cart
router.delete("/remove-property/:userId", removeFromCart)



export default router;
