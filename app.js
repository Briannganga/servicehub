require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const path = require("path");

const requiredEnv = ["JWT_SECRET"];
if (!process.env.DATABASE_URL) {
    requiredEnv.push("DB_HOST", "DB_USER", "DB_NAME", "DB_PASSWORD");
}
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`);
}

const pool = require("./config/db");
const app = express();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try again later." },
});
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please slow down." },
});

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(helmet());
app.use(
    cors({
        origin: allowedOrigins.length ? allowedOrigins : true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

const authMiddleware = require("./config/routes/middleware/authMiddleware");

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/services", require("./routes/serviceRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/messages", require("./routes/messagesRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database connected successfully", time: result.rows[0], source: "app.js" });
    } catch (err) {
        res.status(500).json({ message: "Database connection error", error: err.message });
    }
});

app.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: "Access granted", user: req.user });
});

app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get("/debug/routes", (req, res) => {
    try {
        if (app._router && app._router.stack) {
            const routes = app._router.stack
                .filter((layer) => layer.route)
                .map((layer) => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
            res.json(routes);
        } else {
            res.json({ error: "Routes not yet initialized" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.use((req, res) => {
    res.status(404).json({ message: "Not found." });
});

app.use((err, req, res) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error." });
});

module.exports = app;
