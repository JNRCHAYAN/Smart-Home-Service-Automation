import env from '../config/env.js';

// Thin OpenAI-compatible client with a dual-provider split: DeepSeek serves
// chat completions, while Gemini serves embeddings (DeepSeek has no embeddings
// endpoint). Missing API keys fail loudly at call time via the _require* guards.
const DEEPSEEK_BASE = 'https://api.deepseek.com';

// DeepSeek has no embeddings endpoint, so RAG embeddings fall back to
// Gemini's OpenAI-compatible API when a GEMINI_API_KEY is configured.
const GEMINI_OPENAI_BASE = 'https://generativelanguage.googleapis.com/v1beta/openai';

class AIClient {
  constructor() {
    this.apiKey = env.deepseekApiKey;
    this.model = env.deepseekModel;
    this.embeddingApiKey = env.geminiApiKey;
    this.embeddingModel = env.geminiEmbeddingModel;
    this.baseUrl = DEEPSEEK_BASE;
  }

  _authHeaders() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  _requireChatKey() {
    if (!this.apiKey) {
      throw new Error(
        'DEEPSEEK_API_KEY not configured. Get a key from https://platform.deepseek.com/api_keys'
      );
    }
  }

  _requireEmbeddingKey() {
    if (!this.embeddingApiKey) {
      throw new Error(
        'GEMINI_API_KEY not configured for embeddings (DeepSeek has no embeddings API). Get a key from https://aistudio.google.com/app/apikey'
      );
    }
  }

  async chatCompletion(messages, options = {}) {
    this._requireChatKey();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
        tools: options.tools,
        tool_choice: options.toolChoice ?? 'auto',
        stream: options.stream ?? false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async chatCompletionStream(messages, options = {}) {
    this._requireChatKey();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this._authHeaders(),
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxTokens ?? 2048,
        tools: options.tools,
        tool_choice: options.toolChoice ?? 'auto',
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    return response.body;
  }

  async createEmbedding(text) {
    this._requireEmbeddingKey();

    const response = await fetch(`${GEMINI_OPENAI_BASE}/embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.embeddingApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }
}

export const ai = new AIClient();
