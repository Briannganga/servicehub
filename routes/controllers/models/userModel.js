const pool = require("../../../config/db");

exports.createUser = async (email, name, password) => {
    const result = await pool.query(
        "INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name",
        [email, name, password]
    );

    return result.rows[0];
};

exports.getUserByEmail = async (email) => {
    const result = await pool.query(
        "SELECT id, email, name, password FROM users WHERE email = $1",
        [email]
    );

    return result.rows[0] || null;
};

exports.getUserById = async (id) => {
    const result = await pool.query("SELECT id, email, name FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
};