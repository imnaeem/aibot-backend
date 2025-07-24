const aiService = require("../services/aiService");
const streamingService = require("../services/streamingService");
const {
  sendSuccessResponse,
  sendErrorResponse,
  validateRequiredFields,
  sanitizeInput,
  logRequest,
} = require("../utils/responseHelpers");
const { HTTP_STATUS, ERROR_MESSAGES } = require("../config/constants");

class ChatController {
  /**
   * Handle streaming chat requests
   */
  async streamChat(req, res) {
    try {
      logRequest(req, "- Streaming chat request");

      const { message, model } = req.body;

      // Validate required fields
      const validation = validateRequiredFields(req.body, ["message"]);
      if (!validation.isValid) {
        return sendErrorResponse(
          res,
          ERROR_MESSAGES.MESSAGE_REQUIRED,
          HTTP_STATUS.BAD_REQUEST,
          { missingFields: validation.missingFields }
        );
      }

      // Sanitize input
      const sanitizedMessage = sanitizeInput(message);

      // Validate and set model
      const selectedModel = aiService.validateModel(model);

      // Set up streaming headers
      streamingService.setupSSEHeaders(res);

      // Set up client disconnect handler
      streamingService.setupClientDisconnectHandler(req);

      // Generate and stream AI response
      const tokenGenerator = aiService.generateResponse(
        sanitizedMessage,
        selectedModel
      );
      await streamingService.streamAIResponse(res, tokenGenerator);
    } catch (error) {
      console.error("Stream chat error:", error);
      if (!res.headersSent) {
        streamingService.handleStreamSetupError(res, error);
      }
    }
  }

  /**
   * Handle non-streaming chat requests
   */
  async chat(req, res) {
    try {
      logRequest(req, "- Non-streaming chat request");

      const { message, model } = req.body;

      // Validate required fields
      const validation = validateRequiredFields(req.body, ["message"]);
      if (!validation.isValid) {
        return sendErrorResponse(
          res,
          ERROR_MESSAGES.MESSAGE_REQUIRED,
          HTTP_STATUS.BAD_REQUEST,
          { missingFields: validation.missingFields }
        );
      }

      // Sanitize input
      const sanitizedMessage = sanitizeInput(message);

      // Validate and set model
      const selectedModel = aiService.validateModel(model);

      // Generate complete response
      const fullResponse = await aiService.generateCompleteResponse(
        sanitizedMessage,
        selectedModel
      );

      // Send response
      sendSuccessResponse(
        res,
        {
          response: fullResponse,
          model: selectedModel,
          messageLength: sanitizedMessage.length,
          responseLength: fullResponse.length,
        },
        "Chat response generated successfully"
      );
    } catch (error) {
      console.error("Chat error:", error);
      sendErrorResponse(
        res,
        ERROR_MESSAGES.FAILED_TO_GENERATE_RESPONSE,
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { error: error.message }
      );
    }
  }

  /**
   * Get available models
   */
  getModels(req, res) {
    try {
      logRequest(req, "- Models request");

      const modelsData = aiService.getAvailableModels();
      sendSuccessResponse(
        res,
        modelsData,
        "Available models retrieved successfully"
      );
    } catch (error) {
      console.error("Get models error:", error);
      sendErrorResponse(
        res,
        "Failed to retrieve available models",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { error: error.message }
      );
    }
  }

  /**
   * Test chat endpoint (for development/debugging)
   */
  async testChat(req, res) {
    try {
      logRequest(req, "- Test chat request");

      const testMessage = req.query.message || "Hello, this is a test message";
      const testModel = req.query.model;

      const response = await aiService.generateCompleteResponse(
        testMessage,
        testModel
      );

      sendSuccessResponse(
        res,
        {
          testMessage,
          response,
          timestamp: new Date().toISOString(),
        },
        "Test chat completed successfully"
      );
    } catch (error) {
      console.error("Test chat error:", error);
      sendErrorResponse(
        res,
        "Test chat failed",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { error: error.message }
      );
    }
  }

  /**
   * Get chat statistics (for monitoring)
   */
  getChatStats(req, res) {
    try {
      logRequest(req, "- Chat stats request");

      const stats = {
        availableModels: Object.keys(aiService.getAvailableModels().models)
          .length,
        apiStatus: aiService.getHealthStatus(),
        serverUptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
      };

      sendSuccessResponse(res, stats, "Chat statistics retrieved successfully");
    } catch (error) {
      console.error("Get chat stats error:", error);
      sendErrorResponse(
        res,
        "Failed to retrieve chat statistics",
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        { error: error.message }
      );
    }
  }
}

module.exports = new ChatController();
