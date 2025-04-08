import jwt from "jsonwebtoken";

const secretKey = process.env.JWT_SECRET;

// Generate a JWT token for the user
export const createTokenForUser = (user) => {
    const payload = {
        id: user._id,
        username: user.username,
        role: user.role,
    };

    // Set token expiry time (e.g., 24 hour)
    const options = { expiresIn: '24h' };
    const token = jwt.sign(payload, secretKey, options);
    return token;
};

// Verify a JWT token for the user
export const checkValidateToken = (token) => {
    try {
        const payload = jwt.verify(token, secretKey);
        return payload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
};

// Export the functions as named exports
export default {
    createTokenForUser,
    checkValidateToken,
};
