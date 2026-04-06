const pool = require("../../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validRoles = ["client", "provider"];

// POST /api/auth/register
const register = async (req, res) => {
    const { name, email, password, role } = req.body;

    const normalizedRole = validRoles.includes(role) ? role : "client";

    if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ message: "Please provide a valid email address." });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    try {
        // Check if user already exists
        const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: "Email already registered." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = normalizedRole;

        const result = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
            [name, email, hashedPassword, userRole]
        );

        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({ message: "User registered successfully.", token, user });
    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error during registration.", error: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required." });
    }

    try {
        const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            message: "Login successful.",
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login.", error: err.message });
    }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/auth/users (protected) - list users for messaging
const getUsers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, name, email, role FROM users ORDER BY name"
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GetUsers error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { register, login, getMe, getUsers };