const express = require("express");
const chatController = require("../controllers/chatController");
const { asyncHandler } = require("../middleware/errorMiddleware");

const router = express.Router();

/**
 * @route   POST /api/chat/stream
 * @desc    Stream chat response using Server-Sent Events
 * @access  Public
 */
router.post("/stream", asyncHandler(chatController.streamChat));

/**
 * @route   POST /api/chat
 * @desc    Get complete chat response (non-streaming)
 * @access  Public
 */
router.post("/", asyncHandler(chatController.chat));

/**
 * @route   GET /api/chat/models
 * @desc    Get available AI models
 * @access  Public
 */
router.get("/models", chatController.getModels);

/**
 * @route   GET /api/chat/test
 * @desc    Test chat endpoint for development
 * @access  Public
 */
router.get("/test", asyncHandler(chatController.testChat));

/**
 * @route   GET /api/chat/stats
 * @desc    Get chat statistics and service information
 * @access  Public
 */
router.get("/stats", chatController.getChatStats);

module.exports = router;
