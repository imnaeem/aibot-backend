// Available models (all free on Groq)
const AVAILABLE_MODELS = {
  "llama3-8b": "llama3-8b-8192",
  "llama3-70b": "llama3-70b-8192",
  mixtral: "mixtral-8x7b-32768",
  gemma: "gemma-7b-it",
};

// System prompts
const SYSTEM_PROMPTS = {
  default: `You are a helpful, knowledgeable, and friendly AI assistant. Provide clear, detailed, and useful responses. When showing code examples, always use proper markdown code blocks with language specification (e.g., \`\`\`javascript, \`\`\`python, \`\`\`html, etc.). Use single backticks for inline code elements. Format your responses with proper markdown for better readability.`,
};

// API Response Types
const RESPONSE_TYPES = {
  TOKEN: "token",
  DONE: "done",
  ERROR: "error",
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

// Error Messages
const ERROR_MESSAGES = {
  MESSAGE_REQUIRED: "Message is required",
  INVALID_API_KEY:
    "Invalid API key. Please check your GROQ_API_KEY in the .env file.",
  RATE_LIMIT_EXCEEDED:
    "Rate limit exceeded. Please wait a moment before trying again.",
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  STREAMING_INTERRUPTED: "Streaming interrupted",
  FAILED_TO_START_STREAM: "Failed to start stream",
  FAILED_TO_GENERATE_RESPONSE: "Failed to generate response",
};

// Success Messages
const SUCCESS_MESSAGES = {
  SERVER_RUNNING: "Server is running!",
  API_CONFIGURED: "Groq API configured and ready!",
};

// Setup Instructions
const SETUP_INSTRUCTIONS = {
  API_KEY_WARNING: `⚠️ **API Key Required**

To use real AI responses, please:

1. Get a free API key from [Groq Console](https://console.groq.com/)
2. Create a \`.env\` file in the backend folder
3. Add: \`GROQ_API_KEY=your_actual_key_here\`
4. Restart the server

*Currently using mock responses.*`,

  SETUP_STEPS: [
    "Get free API key: https://console.groq.com/",
    "Create backend/.env file",
    "Add: GROQ_API_KEY=your_actual_key_here",
    "Restart server",
  ],
};

module.exports = {
  AVAILABLE_MODELS,
  SYSTEM_PROMPTS,
  RESPONSE_TYPES,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  SETUP_INSTRUCTIONS,
};
