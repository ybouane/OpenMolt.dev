/**
 * @module providers/OpenAIProvider
 * LLM provider implementation for the OpenAI API (GPT-4o, o1, o3, etc.).
 */

import { BaseProvider } from './BaseProvider.js';
import type { ModelConfig, LLMResponse } from '../types/index.js';

/** Models that use the "reasoning" API surface (no system message, no temp). */
const REASONING_MODELS = new Set(['o1', 'o1-mini', 'o1-preview', 'o3', 'o3-mini', 'o4-mini']);

function isReasoningModel(model: string): boolean {
	return REASONING_MODELS.has(model) || /^o\d/.test(model);
}

/**
 * OpenAI LLM provider.
 * Supports chat-completion models (GPT-4o, GPT-3.5, etc.) and
 * reasoning models (o1, o3 family).
 */
export class OpenAIProvider extends BaseProvider {
	private readonly apiKey: string;
	private readonly baseUrl: string;

	/**
	 * @param apiKey  - OpenAI API key.
	 * @param baseUrl - Override for the API base URL (useful for proxies / Azure).
	 */
	constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
		super();
		this.apiKey = apiKey;
		this.baseUrl = baseUrl;
	}

	/** @inheritdoc */
	async generate(
		systemPrompt: string,
		userMessage: string,
		model: string,
		config?: ModelConfig,
	): Promise<LLMResponse> {
		const isReasoning = isReasoningModel(model);

		const messages: Array<{ role: string; content: string }> = [];

		if (isReasoning) {
			// Reasoning models use a single user message; inject system prompt inline.
			messages.push({ role: 'user', content: `${systemPrompt}\n\n---\n\n${userMessage}` });
		} else {
			messages.push({ role: 'system', content: systemPrompt });
			messages.push({ role: 'user', content: userMessage });
		}

		const body: Record<string, unknown> = {
			model,
			messages,
			response_format: { type: 'json_object' },
		};

		if (!isReasoning) {
			if (config?.temperature !== undefined) body.temperature = config.temperature;
			if (config?.maxTokens) body.max_tokens = config.maxTokens;
		} else {
			if (config?.maxTokens) body.max_completion_tokens = config.maxTokens;
		}

		const response = await fetch(`${this.baseUrl}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${this.apiKey}`,
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`OpenAI API error ${response.status}: ${errText}`);
		}

		const data = (await response.json()) as {
			choices: Array<{ message: { content: string } }>;
			usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
		};

		const content = data.choices[0]?.message?.content ?? '';

		return {
			content,
			usage: {
				promptTokens: data.usage?.prompt_tokens ?? 0,
				completionTokens: data.usage?.completion_tokens ?? 0,
				totalTokens: data.usage?.total_tokens ?? 0,
			},
			raw: data,
		};
	}
}
