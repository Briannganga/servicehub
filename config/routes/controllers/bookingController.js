const pool = require("../../config/db");

exports.createBooking = async (req, res) => {
    try {
        const { service_id, booking_date, notes } = req.body;
        if (!service_id) return res.status(400).json({ message: "service_id is required." });

        const result = await pool.query(
            "INSERT INTO bookings (client_id, service_id, booking_date, notes, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [req.user.id, service_id, booking_date || new Date(), notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;
        let result;

        if (role === "provider") {
            result = await pool.query(
                `SELECT b.*, s.title AS service_title, u.name AS client_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users u ON b.client_id = u.id
                 WHERE s.user_id = $1 ORDER BY b.id DESC`,
                [userId]
            );
        } else {
            result = await pool.query(
                `SELECT b.*, s.title AS service_title, u.name AS provider_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE b.client_id = $1 ORDER BY b.id DESC`,
                [userId]
            );
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const valid = ["pending", "confirmed", "cancelled", "completed"];
        if (!valid.includes(status)) return res.status(400).json({ message: "Invalid status." });

        const result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.deleteBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const check = await pool.query("SELECT client_id FROM bookings WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Booking not found." });
        if (check.rows[0].client_id !== req.user.id) return res.status(403).json({ message: "Forbidden." });
        await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
        res.json({ message: "Booking cancelled." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};