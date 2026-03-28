const express = require("express");
const router = express.Router();
const messagesController = require("./controllers/messagesController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

router.get("/", authMiddleware, messagesController.getMyMessages);
router.post("/", authMiddleware, messagesController.sendMessage);
router.get("/:id", authMiddleware, messagesController.getMessageById);
router.delete("/:id", authMiddleware, messagesController.deleteMessage);

module.exports = router;
