const cors = require("cors");
const { config } = require("../config/environment");

/**
 * CORS configuration
 */
const corsOptions = {
  origin: config.cors.origin,
  credentials: config.cors.credentials,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Accept",
    "Origin",
    "X-Requested-With",
    "Cache-Control",
  ],
  exposedHeaders: ["Content-Length", "Content-Type"],
  maxAge: 86400, // 24 hours
};

/**
 * Configure CORS middleware
 */
const configureCORS = () => {
  return cors(corsOptions);
};

/**
 * Manual CORS headers (for SSE endpoints)
 */
const setManualCORSHeaders = (res) => {
  res.setHeader("Access-Control-Allow-Origin", config.cors.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Accept, Origin, X-Requested-With, Cache-Control"
  );
  res.setHeader("Access-Control-Allow-Credentials", config.cors.credentials);
};

/**
 * Handle preflight OPTIONS requests
 */
const handlePreflight = (req, res, next) => {
  if (req.method === "OPTIONS") {
    setManualCORSHeaders(res);
    res.status(200).end();
    return;
  }
  next();
};

module.exports = {
  configureCORS,
  setManualCORSHeaders,
  handlePreflight,
  corsOptions,
};
