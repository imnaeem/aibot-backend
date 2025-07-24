const { config } = require("../config/environment");
const { RESPONSE_TYPES, ERROR_MESSAGES } = require("../config/constants");

class StreamingService {
  /**
   * Set up Server-Sent Events headers
   */
  setupSSEHeaders(res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });
  }

  /**
   * Send data through SSE
   */
  sendSSEData(res, data) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  /**
   * Send token data
   */
  sendToken(res, content, finished = false) {
    this.sendSSEData(res, {
      type: RESPONSE_TYPES.TOKEN,
      content,
      finished,
    });
  }

  /**
   * Send completion signal
   */
  sendCompletion(res) {
    this.sendSSEData(res, {
      type: RESPONSE_TYPES.DONE,
    });
  }

  /**
   * Send error message
   */
  sendError(res, message) {
    this.sendSSEData(res, {
      type: RESPONSE_TYPES.ERROR,
      message,
    });
  }

  /**
   * Stream AI response with realistic delays
   */
  async streamAIResponse(res, tokenGenerator) {
    try {
      for await (const tokenData of tokenGenerator) {
        // Send token data
        this.sendToken(res, tokenData.token, tokenData.finished);

        // Add small delay to make streaming visible
        if (!tokenData.finished) {
          await this.delay(config.streaming.tokenDelay);
        }

        if (tokenData.finished) {
          break;
        }
      }

      // Send completion event
      this.sendCompletion(res);
      res.end();
    } catch (error) {
      console.error("Streaming error:", error);
      this.sendError(res, ERROR_MESSAGES.STREAMING_INTERRUPTED);
      res.end();
    }
  }

  /**
   * Handle streaming setup errors
   */
  handleStreamSetupError(res, error) {
    console.error("Stream setup error:", error);
    this.sendError(res, ERROR_MESSAGES.FAILED_TO_START_STREAM);
    res.end();
  }

  /**
   * Set up client disconnect handler
   */
  setupClientDisconnectHandler(
    req,
    message = "Client disconnected from stream"
  ) {
    req.on("close", () => {
      console.log(message);
    });
  }

  /**
   * Utility function to create delays
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if request supports streaming
   */
  isStreamingSupported(req) {
    const acceptHeader = req.headers.accept || "";
    return (
      acceptHeader.includes("text/event-stream") ||
      acceptHeader.includes("text/plain") ||
      acceptHeader.includes("*/*")
    );
  }

  /**
   * Gracefully end stream
   */
  endStream(res) {
    try {
      if (!res.headersSent) {
        this.sendCompletion(res);
      }
      res.end();
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  }
}

module.exports = new StreamingService();
