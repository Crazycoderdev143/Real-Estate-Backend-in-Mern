import { app, port, isProduction } from "./app.js";

// Trust proxy headers (required for HTTPS redirect to work behind reverse proxies)
if (isProduction) {
    app.set("trust proxy", 1);

    // Middleware to redirect HTTP to HTTPS
    app.use((req, res, next) => {
        if (req.secure || req.headers["x-forwarded-proto"] === "https") {
            return next();
        }
        const redirectUrl = `https://${req.headers.host}${req.originalUrl}`;
        return res.redirect(301, redirectUrl); // Permanent redirect
    });
}

// Start server
app.listen(port, () => {
    const protocol = isProduction ? "https" : "http";
    const host = isProduction ? process.env.DOMAIN || "yourdomain.com" : `localhost:${port}`;

    console.log(`🚀 Server running at ${protocol}://${host}`);
});
