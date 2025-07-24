const express = require("express");
const { config, isApiKeyConfigured } = require("./config/environment");
const { SUCCESS_MESSAGES, SETUP_INSTRUCTIONS } = require("./config/constants");

// Middleware
const {
  configureCORS,
  handlePreflight,
} = require("./middleware/corsMiddleware");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorMiddleware");

// Routes
const routes = require("./routes");

// Create Express app
const app = express();

/**
 * Global Middleware Setup
 */
app.use(handlePreflight);
app.use(configureCORS());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Request logging middleware (development)
 */
if (config.nodeEnv === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

/**
 * Routes Setup
 */
app.use("/", routes);

/**
 * Error Handling Middleware (must be last)
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Server Startup
 */
const startServer = () => {
  try {
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📡 Health check: http://localhost:${config.port}/health`);
      console.log(`💬 Chat endpoint: http://localhost:${config.port}/api/chat`);
      console.log(
        `🌊 Streaming endpoint: http://localhost:${config.port}/api/chat/stream`
      );
      console.log(`🤖 AI Provider: Groq (Free API)`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);

      // API Key setup check
      if (!isApiKeyConfigured()) {
        console.log(`\n⚠️  SETUP REQUIRED:`);
        SETUP_INSTRUCTIONS.SETUP_STEPS.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step}`);
        });
        console.log("");
      } else {
        console.log(`✅ ${SUCCESS_MESSAGES.API_CONFIGURED}`);
      }

      console.log(
        `\n🔗 API Documentation: http://localhost:${config.port}/api`
      );
      console.log(
        `📊 Detailed Health: http://localhost:${config.port}/health/detailed\n`
      );
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 ${signal} received. Starting graceful shutdown...`);

      server.close((err) => {
        if (err) {
          console.error("❌ Error during server shutdown:", err);
          process.exit(1);
        }

        console.log("✅ Server closed successfully");
        process.exit(0);
      });

      // Force shutdown if graceful shutdown takes too long
      setTimeout(() => {
        console.error("❌ Forced shutdown due to timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (err) => {
      console.error("❌ Uncaught Exception:", err);
      gracefulShutdown("UNCAUGHT_EXCEPTION");
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      gracefulShutdown("UNHANDLED_REJECTION");
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
