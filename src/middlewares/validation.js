import { body, validationResult } from 'express-validator';

// ✅ Reusable middleware to handle validation errors
export const handleValidationErrors = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

// ✅ Signup validation rules
export const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters long.'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Invalid email address.')
        .normalizeEmail(),

    body('password')
        .isStrongPassword()
        .withMessage('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'),

    body('phone')
        .isMobilePhone()
        .withMessage('Invalid phone number.'),
];

// ✅ Login validation rules
export const loginValidation = [
    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email address.')
        .normalizeEmail(),

    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters long.'),

    body('password')
        .notEmpty()
        .withMessage('Password is required.'),
];

// ✅ Update validation rules
export const updateValidation = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters long.'),

    body('email')
        .optional()
        .trim()
        .isEmail()
        .withMessage('Invalid email address.')
        .normalizeEmail(),

    body('password')
        .optional()
        .isStrongPassword()
        .withMessage('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.'),

    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number.'),
];

