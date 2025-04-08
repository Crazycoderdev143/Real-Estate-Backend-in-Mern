export const hasRole = (role) => (req, res, next) => {
    if (req.user?.role !== role) {
        return res.status(403).json({ success: false, message: `Forbidden: ${role}s only` });
    }
    next();
};

// Usage examples:
export const isAdmin = hasRole('Admin');
export const isAgent = hasRole('Agent');
export const isUser = hasRole('User');
