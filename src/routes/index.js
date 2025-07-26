const express = require("express");
const chatRoutes = require("./chatRoutes");
const healthRoutes = require("./healthRoutes");
const modelRoutes = require("./modelRoutes");

const router = express.Router();

/**
 * Mount route modules
 */

// Health routes
router.use("/health", healthRoutes);

// API routes
router.use("/api/chat", chatRoutes);
router.use("/api/models", modelRoutes);

/**
 * API documentation route (placeholder)
 */
router.get("/api", (req, res) => {
  res.json({
    name: "AI Bot API",
    version: "1.0.0",
    description: "AI-powered chat API with streaming support",
    endpoints: {
      health: {
        "/health": "Basic health check",
        "/health/detailed": "Detailed health check",
        "/health/ready": "Readiness probe",
        "/health/live": "Liveness probe",
      },
      chat: {
        "POST /api/chat/stream": "Stream chat response",
        "POST /api/chat": "Get complete chat response",
        "GET /api/chat/models": "Get available models",
        "GET /api/chat/test": "Test endpoint",
        "GET /api/chat/stats": "Service statistics",
      },
      models: {
        "GET /api/models": "Get available models (legacy)",
      },
    },
    provider: "Groq (Free)",
    documentation: "https://github.com/your-repo/chatgpt-clone",
  });
});

/**
 * Root route
 */
router.get("/", (req, res) => {
  res.json({
    message: "Welcome to AI Bot API",
    status: "Server is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      api: "/api",
      health: "/health",
      chat: "/api/chat",
      models: "/api/models",
    },
  });
});

module.exports = router;
