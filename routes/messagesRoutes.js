const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const messagesController = require("./controllers/messagesController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");
const { validateRequest } = require("../config/routes/middleware/validationMiddleware");

router.get("/", authMiddleware, messagesController.getMyMessages);
router.post(
    "/",
    authMiddleware,
    [
        body("receiver_id").isInt().withMessage("receiver_id must be an integer."),
        body("message").trim().notEmpty().withMessage("Message is required."),
    ],
    validateRequest,
    messagesController.sendMessage
);
router.get(
    "/:id",
    authMiddleware,
    [param("id").isInt().withMessage("Message ID must be an integer.")],
    validateRequest,
    messagesController.getMessageById
);
router.delete(
    "/:id",
    authMiddleware,
    [param("id").isInt().withMessage("Message ID must be an integer.")],
    validateRequest,
    messagesController.deleteMessage
);

module.exports = router;
