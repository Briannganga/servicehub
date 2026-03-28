const express = require("express");
const router = express.Router();
const reviewController = require("./controllers/reviewController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

router.post("/", authMiddleware, reviewController.createReview); // add review (client)
router.get("/provider/:providerId", reviewController.getProviderReviews); // public
router.get("/me", authMiddleware, reviewController.getMyReviews); // own reviews

module.exports = router;
