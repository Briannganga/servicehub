const app = require("./app");
const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "server.log");
function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + "\n");
}

fs.writeFileSync(logFile, "Server starting...\n");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
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
}

module.exports = app;
