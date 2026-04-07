const app = require("./app");
const fs = require("fs");
const path = require("path");
const pool = require("./config/db");

const logFile = path.join(__dirname, "server.log");
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
}

fs.writeFileSync(logFile, "Server starting...\n");

const PORT = process.env.PORT || 5000;

// Function to run migrations
async function runMigrations() {
    const migrationsDir = path.join(__dirname, "migrations");
    
    try {
        log("Running database migrations...");
        
        // Ensure migrations table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        
        // Get applied migrations
        const result = await pool.query("SELECT name FROM migrations ORDER BY id");
        const applied = result.rows.map((row) => row.name);
        
        // Get migration files
        const files = fs
            .readdirSync(migrationsDir)
            .filter((file) => file.endsWith(".js"))
            .sort();
        
        // Apply pending migrations
        for (const file of files) {
            if (!applied.includes(file)) {
                log(`Applying migration: ${file}`);
                const migration = require(path.join(migrationsDir, file));
                await migration.up(pool);
                await pool.query("INSERT INTO migrations (name) VALUES ($1)", [file]);
                log(`✓ Migration applied: ${file}`);
            }
        }
        
        log("Migrations completed successfully");
        return true;
    } catch (err) {
        log(`ERROR running migrations: ${err.message}`);
        console.error("Migration error:", err);
        throw err;
    }
}

if (require.main === module) {
    (async () => {
        try {
            // Run migrations first
            await runMigrations();
            
            // Then start the server
            app.listen(PORT, () => {
                log(`Server running on port ${PORT}`);
                log("=== ROUTES INFORMATION ===");
                if (app._router && app._router.stack) {
                    app._router.stack.forEach((layer, idx) => {
                        const routePath = layer.route?.path || layer.name || "unknown";
                        const methods = layer.route ? Object.keys(layer.route.methods).join(",").toUpperCase() : layer.name;
                        log(`  [${idx}] ${methods.padEnd(8)} ${routePath}`);
                    });
                } else {
                    log("app._router not yet initialized (will be created on first request)");
                }
            });
        } catch (err) {
            log(`FATAL: Failed to start server - ${err.message}`);
            process.exit(1);
        }
    })();
}

module.exports = app;
