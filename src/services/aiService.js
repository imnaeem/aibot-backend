const Groq = require("groq-sdk");
const { config, isApiKeyConfigured } = require("../config/environment");
const {
  AVAILABLE_MODELS,
  MODEL_PROVIDERS,
  SYSTEM_PROMPTS,
  ERROR_MESSAGES,
  SETUP_INSTRUCTIONS,
} = require("../config/constants");
const { getMockResponse } = require("../utils/mockResponses");

class AIService {
  constructor() {
    this.groq = new Groq({
      apiKey: config.groq.apiKey,
    });
  }

  /**
   * Validate the selected model
   */
  validateModel(model) {
    // If model exists in our mapping, return the mapped Groq model
    if (model && AVAILABLE_MODELS[model]) {
      return {
        requestedModel: model,
        groqModel: AVAILABLE_MODELS[model],
        provider: MODEL_PROVIDERS[model] || "groq",
      };
    }

    // Fallback to default
    return {
      requestedModel: "llama-2-7b",
      groqModel: config.groq.defaultModel,
      provider: "groq",
    };
  }

  /**
   * Generate AI response with streaming
   */
  async *generateResponse(message, modelInfo) {
    try {
      // Check if API key is configured
      if (!isApiKeyConfigured()) {
        yield* this.generateMockResponse(message, modelInfo);
        return;
      }

      // Use the mapped Groq model for the actual API call
      const groqModelToUse =
        typeof modelInfo === "string" ? modelInfo : modelInfo.groqModel;

      // Create chat completion with streaming
      const stream = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.default,
          },
          { role: "user", content: message },
        ],
        model: groqModelToUse,
        temperature: config.streaming.temperature,
        max_tokens: config.streaming.maxTokens,
        stream: true,
      });

      // Stream the response
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        const finished = chunk.choices[0]?.finish_reason === "stop";

        if (content) {
          yield {
            token: content,
            finished: finished,
          };
        }

        if (finished) {
          break;
        }
      }
    } catch (error) {
      console.error("Groq API Error:", error);
      yield* this.handleAPIError(error);
    }
  }

  /**
   * Generate mock response when API key is not configured
   */
  async *generateMockResponse(message, modelInfo) {
    const requestedModel =
      typeof modelInfo === "string"
        ? modelInfo
        : modelInfo?.requestedModel || "unknown";

    // Initial API key warning with model info
    yield {
      token: `⚠️ **API Key Required** (Requested: ${requestedModel})\n\n${SETUP_INSTRUCTIONS.API_KEY_WARNING}`,
      finished: false,
    };

    // Get contextual mock response
    const mockResponse = getMockResponse(message);

    // Stream the response word by word
    const words = mockResponse.split(" ");
    for (let i = 0; i < words.length; i++) {
      const isLast = i === words.length - 1;
      yield {
        token: words[i] + (isLast ? "" : " "),
        finished: isLast,
      };
    }
  }

  /**
   * Handle API errors and provide helpful error messages
   */
  async *handleAPIError(error) {
    let errorMessage = "❌ **API Error**\n\n";

    if (error.message?.includes("401")) {
      errorMessage += ERROR_MESSAGES.INVALID_API_KEY;
    } else if (error.message?.includes("429")) {
      errorMessage += ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      errorMessage += ERROR_MESSAGES.NETWORK_ERROR;
    } else {
      errorMessage += `Unexpected error: ${error.message}`;
    }

    errorMessage += "\n\n*Falling back to mock response for this request.*";

    yield {
      token: errorMessage,
      finished: true,
    };
  }

  /**
   * Generate complete response (non-streaming)
   */
  async generateCompleteResponse(message, modelInfo) {
    const tokens = [];

    for await (const tokenData of this.generateResponse(message, modelInfo)) {
      tokens.push(tokenData.token);
      if (tokenData.finished) break;
    }

    return tokens.join("");
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      models: AVAILABLE_MODELS,
      providers: MODEL_PROVIDERS,
      default: "llama-2-7b", // Updated to match frontend default
      fallbackGroqModel: config.groq.defaultModel,
      provider: "Mixed (Groq Free Tier + Local)",
    };
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      apiConfigured: isApiKeyConfigured(),
      availableModels: Object.keys(AVAILABLE_MODELS),
      currentModel: config.groq.defaultModel,
      provider: "Groq (Free)",
    };
  }
}

module.exports = new AIService();
