import env from '../config/env.js';

const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com';

class GitHubModelsClient {
  constructor() {
    this.token = env.githubToken;
    this.model = env.githubModel;
    this.baseUrl = GITHUB_MODELS_ENDPOINT;
  }

  async chatCompletion(messages, options = {}) {
    if (!this.token) {
      throw new Error('GITHUB_TOKEN not configured. Get a token from https://github.com/settings/tokens');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
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
      throw new Error(`GitHub Models API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async chatCompletionStream(messages, options = {}) {
    if (!this.token) {
      throw new Error('GITHUB_TOKEN not configured. Get a token from https://github.com/settings/tokens');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
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
      throw new Error(`GitHub Models API error: ${response.status} - ${error}`);
    }

    return response.body;
  }

  async createEmbedding(text) {
    if (!this.token) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GitHub Models Embedding error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }
}

export const githubModels = new GitHubModelsClient();