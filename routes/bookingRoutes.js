const express = require("express");
const router = express.Router();
const bookingController = require("./controllers/bookingController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

// Booking routes
router.get("/", authMiddleware, bookingController.getMyBookings); // get all bookings for current user
router.post("/", authMiddleware, bookingController.createBooking); // POST to root path for creation
router.patch("/:id/status", authMiddleware, bookingController.updateBookingStatus); // update booking status
router.delete("/:id", authMiddleware, bookingController.deleteBooking);

module.exports = router;
