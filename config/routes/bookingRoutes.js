const express = require("express");
const router = express.Router();
const {
    getMyBookings,
    createBooking,
    updateBookingStatus,
    deleteBooking,
} = require("./controllers/bookingController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

// All booking routes are protected
router.use(authMiddleware);

router.get("/", getMyBookings);
router.post("/", createBooking);
router.patch("/:id/status", updateBookingStatus);
router.delete("/:id", deleteBooking);

module.exports = router;