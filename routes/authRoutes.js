const express = require("express");
const { body } = require("express-validator");
const router = express.Router();
const authController = require("./controllers/authController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");
const { validateRequest } = require("../config/routes/middleware/validationMiddleware");

// Auth routes
router.post(
    "/register",
    [
        body("name").trim().notEmpty().withMessage("Name is required."),
        body("email").isEmail().withMessage("Valid email is required."),
        body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
        body("role").optional().isIn(["client", "provider"]).withMessage("Role must be client or provider."),
    ],
    validateRequest,
    authController.register
);
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Valid email is required."),
        body("password").notEmpty().withMessage("Password is required."),
    ],
    validateRequest,
    authController.login
);
router.get("/me", authMiddleware, authController.getMe); // protected route
router.get("/users", authMiddleware, authController.getUsers); // list users for messaging

module.exports = router;
