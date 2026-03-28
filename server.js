require("dotenv").config(); // Load env vars first

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const pool = require("./config/db");

const app = express();

// Log file
const logFile = path.join(__dirname, 'server.log');
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

// Clear log at startup
fs.writeFileSync(logFile, 'Server starting...\n');

// Middleware
app.use(cors());
app.use(express.json());

// Static files for frontend
const publicDir = path.join(__dirname, "public");
app.use(express.static(publicDir));

// Auto-create `reviews` table when missing (safe, idempotent)
(async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('reviews table ready');
    } catch (err) {
        console.error('Failed to create reviews table:', err);
    }
})();

// Auth Middleware
const authMiddleware = require("./config/routes/middleware/authMiddleware");

// Routes
log("\n=== LOADING ROUTES ===");

try {
    log("Loading authRoutes...");
    const authRoutes = require("./routes/authRoutes");
    log("  authRoutes loaded, type: " + typeof authRoutes + ", constructor: " + authRoutes.constructor.name);
    app.use("/api/auth", authRoutes);
    log("  ✓ authRoutes mounted to /api/auth");
} catch(e) { log("  ✗ authRoutes error: " + e.message); }

try {
    log("Loading serviceRoutes...");
    const serviceRoutes = require("./routes/serviceRoutes");
    log("  serviceRoutes loaded, type: " + typeof serviceRoutes + ", constructor: " + serviceRoutes.constructor.name);
    app.use("/api/services", serviceRoutes);
    log("  ✓ serviceRoutes mounted to /api/services");
} catch(e) { log("  ✗ serviceRoutes error: " + e.message); }

try {
    log("Loading bookingRoutes...");
    const bookingRoutes = require("./routes/bookingRoutes");
    log("  bookingRoutes loaded, type: " + typeof bookingRoutes + ", constructor: " + bookingRoutes.constructor.name);
    app.use("/api/bookings", bookingRoutes);
    log("  ✓ bookingRoutes mounted to /api/bookings");
} catch(e) { log("  ✗ bookingRoutes error: " + e.message); }

try {
    log("Loading messagesRoutes...");
    const messagesRoutes = require("./routes/messagesRoutes");
    log("  messagesRoutes loaded, type: " + typeof messagesRoutes + ", constructor: " + messagesRoutes.constructor.name);
    app.use("/api/messages", messagesRoutes);
    log("  ✓ messagesRoutes mounted to /api/messages");
} catch(e) { log("  ✗ messagesRoutes error: " + e.message); }

try {
    log("Loading reviewRoutes...");
    const reviewRoutes = require("./routes/reviewRoutes");
    log("  reviewRoutes loaded, type: " + typeof reviewRoutes + ", constructor: " + reviewRoutes.constructor.name);
    app.use("/api/reviews", reviewRoutes);
    log("  ✓ reviewRoutes mounted to /api/reviews");
} catch(e) { log("  ✗ reviewRoutes error: " + e.message); }

log("=== ROUTES LOADING COMPLETE ===\n");

// Default route - serve frontend
app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

// Test DB connection
app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({ message: "Database connected successfully", time: result.rows[0], source: "server.js" });
    } catch (err) {
        log("DB error: " + err.message);
        res.status(500).send("Database connection error");
    }
});

// Protected test route
app.get("/protected", authMiddleware, (req, res) => {
    res.json({ message: "Access granted", user: req.user });
});

app.get("/debug/routes", (req, res) => {
    try {
        if (app._router && app._router.stack) {
            const routes = app._router.stack
                .filter(layer => layer.route)
                .map(layer => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }));
            res.json(routes);
        } else {
            res.json({ error: "Routes not yet initialized" });
        }
    } catch(e) {
        res.status(500).json({error: e.message});
    }
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
    
    // Trigger router initialization
    log('\n=== ROUTES INFORMATION ===');
    // Use app._router.stack after first request, or check app._router directly
    setImmediate(() => {
        if (app._router && app._router.stack) {
            log("Middleware & routes registered:");
            app._router.stack.forEach((layer, idx) => {
                const routePath = layer.route?.path || layer.name || 'unknown';
                const methods = layer.route ? Object.keys(layer.route.methods).join(',').toUpperCase() : layer.name;
                log(`  [${idx}] ${methods.padEnd(8)} ${routePath}`);
            });
        } else {
            log("app._router not yet initialized (will be created on first request)");
        }
    });
});