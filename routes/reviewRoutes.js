const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const reviewController = require("./controllers/reviewController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");
const { validateRequest } = require("../config/routes/middleware/validationMiddleware");

router.post(
    "/",
    authMiddleware,
    [
        body("provider_id").isInt().withMessage("provider_id must be an integer."),
        body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5."),
        body("service_id").optional().isInt().withMessage("service_id must be an integer."),
        body("comment").optional().trim().isString(),
    ],
    validateRequest,
    reviewController.createReview
); // add review (client)
router.get(
    "/provider/:providerId",
    [param("providerId").isInt().withMessage("Provider ID must be an integer.")],
    validateRequest,
    reviewController.getProviderReviews
); // public
router.get("/me", authMiddleware, reviewController.getMyReviews); // own reviews

module.exports = router;
