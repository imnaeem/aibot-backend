const Groq = require("groq-sdk");
const { config, isApiKeyConfigured } = require("../config/environment");
const {
  AVAILABLE_MODELS,
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
    return model && AVAILABLE_MODELS[model]
      ? AVAILABLE_MODELS[model]
      : config.groq.defaultModel;
  }

  /**
   * Generate AI response with streaming
   */
  async *generateResponse(message, model = config.groq.defaultModel) {
    try {
      // Check if API key is configured
      if (!isApiKeyConfigured()) {
        yield* this.generateMockResponse(message);
        return;
      }

      // Create chat completion with streaming
      const stream = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPTS.default,
          },
          { role: "user", content: message },
        ],
        model: model,
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
  async *generateMockResponse(message) {
    // Initial API key warning
    yield {
      token: SETUP_INSTRUCTIONS.API_KEY_WARNING,
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
  async generateCompleteResponse(message, model = config.groq.defaultModel) {
    const tokens = [];

    for await (const tokenData of this.generateResponse(message, model)) {
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
      default: config.groq.defaultModel,
      provider: "Groq (Free)",
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
