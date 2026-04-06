const pool = require("../../config/db");

// GET /api/bookings - get bookings for logged-in user
const getMyBookings = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    try {
        let result;
        if (role === "provider") {
            result = await pool.query(
                `SELECT b.*, s.title AS service_title, u.name AS client_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users u ON b.client_id = u.id
                 WHERE s.user_id = $1
                 ORDER BY b.id DESC`,
                [userId]
            );
        } else {
            result = await pool.query(
                `SELECT b.*, s.title AS service_title, u.name AS provider_name
                 FROM bookings b
                 JOIN services s ON b.service_id = s.id
                 JOIN users u ON s.user_id = u.id
                 WHERE b.client_id = $1
                 ORDER BY b.id DESC`,
                [userId]
            );
        }
        res.json(result.rows);
    } catch (err) {
        console.error("GetMyBookings error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// POST /api/bookings - create a booking
const createBooking = async (req, res) => {
    const { service_id, booking_date, notes } = req.body;
    const client_id = req.user.id;

    if (!service_id) {
        return res.status(400).json({ message: "service_id is required." });
    }

    try {
        const service = await pool.query("SELECT id, user_id FROM services WHERE id = $1", [service_id]);
        if (service.rows.length === 0) {
            return res.status(404).json({ message: "Service not found." });
        }

        const serviceOwnerId = service.rows[0].user_id;
        if (serviceOwnerId === client_id) {
            return res.status(400).json({ message: "You cannot book your own service." });
        }

        const bookingDate = booking_date ? new Date(booking_date) : new Date();
        if (isNaN(bookingDate.getTime())) {
            return res.status(400).json({ message: "Invalid booking date." });
        }
        if (bookingDate < new Date()) {
            return res.status(400).json({ message: "Booking date must be in the future." });
        }

        const result = await pool.query(
            "INSERT INTO bookings (client_id, service_id, booking_date, notes, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
            [client_id, service_id, bookingDate, notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("CreateBooking error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// PATCH /api/bookings/:id/status - update booking status
const updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Status must be one of: ${validStatuses.join(", ")}` });
    }

    try {
        const booking = await pool.query(
            `SELECT b.*, s.user_id AS provider_id
             FROM bookings b
             JOIN services s ON b.service_id = s.id
             WHERE b.id = $1`,
            [id]
        );

        if (booking.rows.length === 0) return res.status(404).json({ message: "Booking not found." });

        const bookingRow = booking.rows[0];
        const requester = req.user.id;
        if (bookingRow.client_id !== requester && bookingRow.provider_id !== requester) {
            return res.status(403).json({ message: "Forbidden." });
        }

        const result = await pool.query(
            "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("UpdateBookingStatus error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

// DELETE /api/bookings/:id - cancel booking
const deleteBooking = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const check = await pool.query("SELECT client_id FROM bookings WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Booking not found." });
        if (check.rows[0].client_id !== userId) return res.status(403).json({ message: "Forbidden." });

        await pool.query("DELETE FROM bookings WHERE id = $1", [id]);
        res.json({ message: "Booking cancelled." });
    } catch (err) {
        console.error("DeleteBooking error:", err);
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = { getMyBookings, createBooking, updateBookingStatus, deleteBooking };