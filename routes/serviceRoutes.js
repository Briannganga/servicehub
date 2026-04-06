const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();
const serviceController = require("./controllers/serviceController");
const authMiddleware = require("../config/routes/middleware/authMiddleware");
const { validateRequest } = require("../config/routes/middleware/validationMiddleware");

// Service routes
router.get("/", serviceController.getAllServices); // public
router.post(
    "/",
    authMiddleware,
    [
        body("title").trim().notEmpty().withMessage("Title is required."),
        body("price").isFloat({ gt: 0 }).withMessage("Price must be a positive number."),
        body("description").optional().isString().trim(),
        body("category").optional().isString().trim(),
    ],
    validateRequest,
    serviceController.createService
); // protected
router.get(
    "/:id",
    [param("id").isInt().withMessage("Service ID must be an integer")],
    validateRequest,
    serviceController.getServiceById
); // public
router.put(
    "/:id",
    authMiddleware,
    [
        param("id").isInt().withMessage("Service ID must be an integer"),
        body("title").optional().trim().notEmpty().withMessage("Title cannot be empty."),
        body("price").optional().isFloat({ gt: 0 }).withMessage("Price must be a positive number."),
        body("description").optional().isString().trim(),
        body("category").optional().isString().trim(),
    ],
    validateRequest,
    serviceController.updateService
); // protected
router.delete(
    "/:id",
    authMiddleware,
    [param("id").isInt().withMessage("Service ID must be an integer")],
    validateRequest,
    serviceController.deleteService
); // protected

module.exports = router;
