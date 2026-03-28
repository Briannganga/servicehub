console.log('Loaded routes/serviceRoutes');
const express = require("express");
const router = express.Router();
const serviceController = require("./controllers/serviceController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

// Service routes
router.get("/", serviceController.getAllServices); // public
router.post("/", authMiddleware, serviceController.createService); // protected
router.get("/:id", serviceController.getServiceById); // public
router.put("/:id", authMiddleware, serviceController.updateService); // protected
router.delete("/:id", authMiddleware, serviceController.deleteService); // protected

module.exports = router;
