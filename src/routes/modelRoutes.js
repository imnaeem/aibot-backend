const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

/**
 * @route   GET /api/models
 * @desc    Get available AI models (legacy endpoint)
 * @access  Public
 */
router.get("/", chatController.getModels);

module.exports = router;
