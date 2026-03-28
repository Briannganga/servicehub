const pool = require("../config/db");
const bcrypt = require("bcrypt");

// REGISTER USER
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, hashedPassword, role || "client"]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};