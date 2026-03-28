const pool = require("../config/db");

// GET /api/services - list all services
const getAllServices = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT s.*, u.name AS provider_name 
             FROM services s 
             JOIN users u ON s.user_id = u.id 
             ORDER BY s.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GetAllServices error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/services/:id - get single service
const getServiceById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `SELECT s.*, u.name AS provider_name 
             FROM services s 
             JOIN users u ON s.user_id = u.id 
             WHERE s.id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Service not found." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("GetServiceById error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/services - create a service (provider only)
const createService = async (req, res) => {
    const { title, description, price, category } = req.body;
    const user_id = req.user.id;

    if (!title || !price) {
        return res.status(400).json({ message: "Title and price are required." });
    }

    try {
        const result = await pool.query(
            "INSERT INTO services (title, description, price, category, user_id, provider_id) VALUES ($1, $2, $3, $4, $5, $5) RETURNING *",
            [title, description, price, category, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("CreateService error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// PUT /api/services/:id - update a service (owner only)
const updateService = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, category } = req.body;
    const userId = req.user.id;

    try {
        const check = await pool.query("SELECT user_id FROM services WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Service not found." });
        if (check.rows[0].user_id !== userId) return res.status(403).json({ message: "Forbidden." });

        const result = await pool.query(
            "UPDATE services SET title=$1, description=$2, price=$3, category=$4 WHERE id=$5 RETURNING *",
            [title, description, price, category, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("UpdateService error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// DELETE /api/services/:id - delete a service (owner only)
const deleteService = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const check = await pool.query("SELECT user_id FROM services WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Service not found." });
        if (check.rows[0].user_id !== userId) return res.status(403).json({ message: "Forbidden." });

        await pool.query("DELETE FROM services WHERE id = $1", [id]);
        res.json({ message: "Service deleted." });
    } catch (err) {
        console.error("DeleteService error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getAllServices, getServiceById, createService, updateService, deleteService };