/**
 * @module providers/OpenAIProvider
 * LLM provider implementation for the OpenAI API (GPT-4o, o1, o3, etc.).
 * Uses the official `openai` SDK.
 */

import OpenAI from 'openai';
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
	private readonly client: OpenAI;

	/**
	 * @param apiKey  - OpenAI API key.
	 * @param baseUrl - Override for the API base URL (useful for proxies / Azure).
	 */
	constructor(apiKey: string, baseUrl?: string) {
		super();
		this.client = new OpenAI({
			apiKey,
			...(baseUrl ? { baseURL: baseUrl } : {}),
		});
	}

	/** @inheritdoc */
	async generate(
		systemPrompt: string,
		userMessage: string,
		model: string,
		config?: ModelConfig,
	): Promise<LLMResponse> {
		const isReasoning = isReasoningModel(model);

		const messages: OpenAI.ChatCompletionMessageParam[] = isReasoning
			? [{ role: 'user', content: `${systemPrompt}\n\n---\n\n${userMessage}` }]
			: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userMessage },
			];

		const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
			model,
			messages,
			response_format: { type: 'json_object' },
		};

		if (!isReasoning) {
			if (config?.temperature !== undefined) params.temperature = config.temperature;
			if (config?.maxTokens) params.max_tokens = config.maxTokens;
		} else {
			if (config?.maxTokens) {
				(params as unknown as Record<string, unknown>).max_completion_tokens = config.maxTokens;
				delete params.max_tokens;
			}
		}

		const response = await this.client.chat.completions.create(params);
		const content = response.choices[0]?.message?.content ?? '';

		return {
			content,
			usage: {
				promptTokens: response.usage?.prompt_tokens ?? 0,
				completionTokens: response.usage?.completion_tokens ?? 0,
				totalTokens: response.usage?.total_tokens ?? 0,
			},
			raw: response,
		};
	}
}
