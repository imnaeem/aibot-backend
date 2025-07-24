const express = require("express");
const healthController = require("../controllers/healthController");

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get("/", healthController.getHealth);

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with system information
 * @access  Public
 */
router.get("/detailed", healthController.getDetailedHealth);

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes/Docker
 * @access  Public
 */
router.get("/ready", healthController.getReadiness);

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes/Docker
 * @access  Public
 */
router.get("/live", healthController.getLiveness);

module.exports = router;
