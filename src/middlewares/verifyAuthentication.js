import { checkValidateToken } from "../services/authentication.js"

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer")) {
            return res.status(401).json({ message: "Unauthorized: Token is missing or malformed" });
        }

        const token = authHeader.split(" ")[1];

        const payload = checkValidateToken(token); // Validate and decode token
        req.user = payload; // Attach user info to request
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

export default authMiddleware;
