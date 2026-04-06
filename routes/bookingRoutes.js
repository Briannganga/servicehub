const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const bookingController = require("./controllers/bookingController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");
const { validateRequest } = require("../config/routes/middleware/validationMiddleware");

// Booking routes
router.get("/", authMiddleware, bookingController.getMyBookings); // get all bookings for current user
router.post(
    "/",
    authMiddleware,
    [
        body("service_id").isInt().withMessage("service_id must be an integer."),
        body("booking_date").optional().isISO8601().withMessage("booking_date must be a valid date."),
        body("notes").optional().isString().trim(),
    ],
    validateRequest,
    bookingController.createBooking
); // POST to root path for creation
router.patch(
    "/:id/status",
    authMiddleware,
    [
        param("id").isInt().withMessage("Booking ID must be an integer."),
        body("status").isIn(["pending", "confirmed", "cancelled", "completed"]).withMessage("Invalid status."),
    ],
    validateRequest,
    bookingController.updateBookingStatus
); // update booking status
router.delete(
    "/:id",
    authMiddleware,
    [param("id").isInt().withMessage("Booking ID must be an integer.")],
    validateRequest,
    bookingController.deleteBooking
);

module.exports = router;
