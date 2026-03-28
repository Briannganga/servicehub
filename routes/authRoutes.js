const express = require("express");
const router = express.Router();
const authController = require("./controllers/authController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

// Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getMe); // protected route
router.get("/users", authMiddleware, authController.getUsers); // list users for messaging

module.exports = router;
