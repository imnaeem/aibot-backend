const aiService = require("../services/aiService");
const {
  createHealthResponse,
  sendSuccessResponse,
  logRequest,
} = require("../utils/responseHelpers");
const { SUCCESS_MESSAGES } = require("../config/constants");
const { config, isApiKeyConfigured } = require("../config/environment");

class HealthController {
  /**
   * Basic health check endpoint
   */
  getHealth(req, res) {
    try {
      logRequest(req, "- Health check");

      const healthData = createHealthResponse(SUCCESS_MESSAGES.SERVER_RUNNING, {
        ...aiService.getHealthStatus(),
        environment: config.nodeEnv,
        version: process.env.npm_package_version || "1.0.0",
      });

      sendSuccessResponse(res, healthData, "Health check completed");
    } catch (error) {
      console.error("Health check error:", error);
      const errorHealthData = createHealthResponse(
        "Server running with errors",
        {
          error: error.message,
          apiConfigured: false,
        }
      );

      sendSuccessResponse(
        res,
        errorHealthData,
        "Health check completed with warnings"
      );
    }
  }

  /**
   * Detailed health check with system information
   */
  getDetailedHealth(req, res) {
    try {
      logRequest(req, "- Detailed health check");

      const healthData = {
        status: SUCCESS_MESSAGES.SERVER_RUNNING,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv,

        // API Status
        api: {
          configured: isApiKeyConfigured(),
          provider: "Groq (Free)",
          ...aiService.getHealthStatus(),
        },

        // System Information
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            external: Math.round(process.memoryUsage().external / 1024 / 1024),
          },
          cpu: {
            loadAverage:
              process.platform !== "win32"
                ? require("os").loadavg()
                : [0, 0, 0],
            cpus: require("os").cpus().length,
          },
        },

        // Configuration
        config: {
          port: config.port,
          cors: config.cors.origin,
          streaming: {
            tokenDelay: config.streaming.tokenDelay,
            maxTokens: config.streaming.maxTokens,
            temperature: config.streaming.temperature,
          },
        },

        // Service Status
        services: {
          aiService: "healthy",
          streamingService: "healthy",
        },
      };

      sendSuccessResponse(res, healthData, "Detailed health check completed");
    } catch (error) {
      console.error("Detailed health check error:", error);

      const errorHealthData = {
        status: "Server running with errors",
        timestamp: new Date().toISOString(),
        error: error.message,
        uptime: process.uptime(),
      };

      sendSuccessResponse(
        res,
        errorHealthData,
        "Health check completed with errors"
      );
    }
  }

  /**
   * Readiness probe (for Kubernetes/Docker deployments)
   */
  getReadiness(req, res) {
    try {
      logRequest(req, "- Readiness check");

      // Check if all services are ready
      const isReady = true; // Add more sophisticated checks here if needed

      if (isReady) {
        sendSuccessResponse(res, { ready: true }, "Service is ready");
      } else {
        res.status(503).json({
          ready: false,
          message: "Service not ready",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Readiness check error:", error);
      res.status(503).json({
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Liveness probe (for Kubernetes/Docker deployments)
   */
  getLiveness(req, res) {
    try {
      logRequest(req, "- Liveness check");

      // Basic liveness check - server is responding
      sendSuccessResponse(res, { alive: true }, "Service is alive");
    } catch (error) {
      console.error("Liveness check error:", error);
      res.status(500).json({
        alive: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new HealthController();
