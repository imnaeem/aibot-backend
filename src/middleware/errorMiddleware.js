const { sendErrorResponse } = require("../utils/responseHelpers");
const { HTTP_STATUS } = require("../config/constants");
const { isDevelopment } = require("../config/environment");

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error occurred:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  // Default error
  let statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal Server Error";

  // Specific error handling
  if (err.name === "ValidationError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Validation Error";
  } else if (err.name === "CastError") {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Invalid data format";
  } else if (err.code === 11000) {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = "Duplicate field value";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = "Token expired";
  }

  // Send error response
  sendErrorResponse(
    res,
    message,
    statusCode,
    isDevelopment() ? { stack: err.stack } : null
  );
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  sendErrorResponse(
    res,
    `Route ${req.originalUrl} not found`,
    HTTP_STATUS.NOT_FOUND || 404,
    {
      method: req.method,
      url: req.originalUrl,
    }
  );
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Rate limiting error handler
 */
const rateLimitHandler = (req, res) => {
  sendErrorResponse(
    res,
    "Too many requests, please try again later",
    HTTP_STATUS.TOO_MANY_REQUESTS,
    {
      retryAfter: req.rateLimit?.resetTime,
    }
  );
};

/**
 * Request timeout handler
 */
const timeoutHandler = (req, res) => {
  if (!res.headersSent) {
    sendErrorResponse(
      res,
      "Request timeout",
      408, // Request Timeout
      {
        timeout: true,
      }
    );
  }
};

/**
 * Validation error formatter
 */
const formatValidationError = (error) => {
  const errors = {};

  if (error.details) {
    error.details.forEach((detail) => {
      errors[detail.path] = detail.message;
    });
  }

  return {
    message: "Validation failed",
    errors,
  };
};

/**
 * Log errors to external service (placeholder)
 */
const logErrorToService = (error, req) => {
  // In production, you might want to log to services like:
  // - Sentry
  // - LogRocket
  // - DataDog
  // - CloudWatch

  if (!isDevelopment()) {
    console.log("Would log to external service:", {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      userAgent: req.get("User-Agent"),
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  rateLimitHandler,
  timeoutHandler,
  formatValidationError,
  logErrorToService,
};
