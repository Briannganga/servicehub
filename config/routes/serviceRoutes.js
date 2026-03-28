const express = require("express");
const router = express.Router();
const {
    getAllServices,
    getServiceById,
    createService,
    updateService,
    deleteService,
} = require("./controllers/serviceController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");

router.get("/", getAllServices);                          // public
router.get("/:id", getServiceById);                      // public
router.post("/", authMiddleware, createService);         // protected
router.put("/:id", authMiddleware, updateService);       // protected
router.delete("/:id", authMiddleware, deleteService);    // protected

module.exports = router;