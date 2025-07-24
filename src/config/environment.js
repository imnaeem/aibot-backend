require("dotenv").config();

const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",

  // API Configuration
  groq: {
    apiKey: process.env.GROQ_API_KEY || "your_groq_api_key_here",
    defaultModel: process.env.DEFAULT_MODEL || "llama3-8b-8192",
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  },

  // Streaming Configuration
  streaming: {
    tokenDelay: parseInt(process.env.TOKEN_DELAY) || 20,
    maxTokens: parseInt(process.env.MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
  },
};

// Validation
const isApiKeyConfigured = () => {
  return config.groq.apiKey && config.groq.apiKey !== "your_groq_api_key_here";
};

const isDevelopment = () => {
  return config.nodeEnv === "development";
};

const isProduction = () => {
  return config.nodeEnv === "production";
};

module.exports = {
  config,
  isApiKeyConfigured,
  isDevelopment,
  isProduction,
};
