const fs = require("fs");
const path = require("path");
require("dotenv").config();
const pool = require("../config/db");

const migrationsTable = "migrations";
const migrationsDir = path.join(__dirname, "..", "migrations");

async function ensureMigrationsTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${migrationsTable} (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function getAppliedMigrations() {
    const result = await pool.query(`SELECT name FROM ${migrationsTable} ORDER BY id`);
    return result.rows.map((row) => row.name);
}

function listMigrationFiles() {
    return fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".js"))
        .sort();
}

async function applyMigration(file) {
    const migration = require(path.join(migrationsDir, file));
    if (typeof migration.up !== "function") {
        throw new Error(`Migration ${file} does not export an up() function.`);
    }
    await migration.up(pool);
    await pool.query(`INSERT INTO ${migrationsTable} (name) VALUES ($1)`, [file]);
}

async function rollbackMigration(file) {
    const migration = require(path.join(migrationsDir, file));
    if (typeof migration.down !== "function") {
        throw new Error(`Migration ${file} does not export a down() function.`);
    }
    await migration.down(pool);
    await pool.query(`DELETE FROM ${migrationsTable} WHERE name = $1`, [file]);
}

async function up() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = listMigrationFiles();
    const pending = files.filter((file) => !applied.includes(file));

    if (pending.length === 0) {
        console.log("No pending migrations.");
        return;
    }

    for (const file of pending) {
        console.log(`Applying migration: ${file}`);
        await applyMigration(file);
    }
    console.log("Migrations complete.");
}

async function down() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    if (applied.length === 0) {
        console.log("No applied migrations to roll back.");
        return;
    }
    const last = applied[applied.length - 1];
    console.log(`Rolling back migration: ${last}`);
    await rollbackMigration(last);
    console.log("Rollback complete.");
}

async function status() {
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();
    const files = listMigrationFiles();

    console.log("Migration status:\n");
    for (const file of files) {
        const state = applied.includes(file) ? "APPLIED" : "PENDING";
        console.log(`${state.padEnd(8)} ${file}`);
    }
}

async function main() {
    const [command] = process.argv.slice(2);

    try {
        if (command === "up" || !command) {
            await up();
        } else if (command === "down") {
            await down();
        } else if (command === "status") {
            await status();
        } else {
            console.error(`Unknown migration command: ${command}`);
            console.error("Usage: node scripts/migrate.js [up|down|status]");
            process.exit(1);
        }
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

main();
