const { HTTP_STATUS } = require("../config/constants");

/**
 * Create a standardized success response
 */
const createSuccessResponse = (data, message = "Success") => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Create a standardized error response
 */
const createErrorResponse = (
  message,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details = null
) => {
  return {
    success: false,
    error: {
      message,
      statusCode,
      details,
    },
    timestamp: new Date().toISOString(),
  };
};

/**
 * Send success response
 */
const sendSuccessResponse = (
  res,
  data,
  message = "Success",
  statusCode = HTTP_STATUS.OK
) => {
  return res.status(statusCode).json(createSuccessResponse(data, message));
};

/**
 * Send error response
 */
const sendErrorResponse = (
  res,
  message,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details = null
) => {
  return res
    .status(statusCode)
    .json(createErrorResponse(message, statusCode, details));
};

/**
 * Create health check response
 */
const createHealthResponse = (status, additionalData = {}) => {
  return {
    status,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    ...additionalData,
  };
};

/**
 * Validate required fields in request body
 */
const validateRequiredFields = (body, requiredFields) => {
  const missingFields = [];

  for (const field of requiredFields) {
    if (
      !body[field] ||
      (typeof body[field] === "string" && !body[field].trim())
    ) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};

/**
 * Create pagination metadata
 */
const createPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove basic HTML tags
    .substring(0, 10000); // Limit length
};

/**
 * Log request details
 */
const logRequest = (req, message = "") => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[${timestamp}] ${method} ${url} - ${ip} ${message}`);
};

/**
 * Create API key warning response
 */
const createApiKeyWarningResponse = () => {
  return createErrorResponse(
    "API key not configured. Please add GROQ_API_KEY to your environment variables.",
    HTTP_STATUS.UNAUTHORIZED,
    {
      setupInstructions: [
        "Get a free API key from https://console.groq.com/",
        "Create a .env file in the backend directory",
        "Add: GROQ_API_KEY=your_actual_key_here",
        "Restart the server",
      ],
    }
  );
};

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  sendSuccessResponse,
  sendErrorResponse,
  createHealthResponse,
  validateRequiredFields,
  createPaginationMeta,
  sanitizeInput,
  logRequest,
  createApiKeyWarningResponse,
};
