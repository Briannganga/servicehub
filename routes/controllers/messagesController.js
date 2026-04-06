const pool = require("../../config/db");

// GET /api/messages (inbox and outbox for the user)
const getMyMessages = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await pool.query(
            `SELECT m.*, s.name AS sender_name, r.name AS receiver_name
             FROM messages m
             JOIN users s ON m.sender_id = s.id
             JOIN users r ON m.receiver_id = r.id
             WHERE m.sender_id = $1 OR m.receiver_id = $1
             ORDER BY m.sent_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error("GetMyMessages error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// GET /api/messages/:id
const getMessageById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query("SELECT * FROM messages WHERE id = $1", [id]);
        if (!result.rows.length) {
            return res.status(404).json({ message: "Message not found." });
        }
        const message = result.rows[0];
        if (message.sender_id !== userId && message.receiver_id !== userId) {
            return res.status(403).json({ message: "Forbidden." });
        }
        res.json(message);
    } catch (err) {
        console.error("GetMessageById error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/messages
const sendMessage = async (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, message } = req.body;

    if (!receiver_id || !message) {
        return res.status(400).json({ message: "receiver_id and message are required." });
    }

    try {
        if (sender_id === receiver_id) {
            return res.status(400).json({ message: "You cannot send a message to yourself." });
        }

        const receiverCheck = await pool.query("SELECT id FROM users WHERE id = $1", [receiver_id]);
        if (!receiverCheck.rows.length) {
            return res.status(404).json({ message: "Receiver not found." });
        }

        const result = await pool.query(
            "INSERT INTO messages (sender_id, receiver_id, message) VALUES ($1, $2, $3) RETURNING *",
            [sender_id, receiver_id, message]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("SendMessage error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// DELETE /api/messages/:id
const deleteMessage = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await pool.query("SELECT * FROM messages WHERE id = $1", [id]);
        if (!result.rows.length) {
            return res.status(404).json({ message: "Message not found." });
        }
        const message = result.rows[0];
        if (message.sender_id !== userId && message.receiver_id !== userId) {
            return res.status(403).json({ message: "Forbidden." });
        }

        await pool.query("DELETE FROM messages WHERE id = $1", [id]);
        res.json({ message: "Message deleted." });
    } catch (err) {
        console.error("DeleteMessage error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = {
    getMyMessages,
    getMessageById,
    sendMessage,
    deleteMessage,
};
