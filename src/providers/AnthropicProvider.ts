/**
 * @module providers/AnthropicProvider
 * LLM provider implementation for the Anthropic API (Claude models).
 * Uses the official `@anthropic-ai/sdk` package.
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './BaseProvider.js';
import type { ModelConfig, LLMResponse } from '../types/index.js';

/**
 * Anthropic LLM provider.
 * Supports all Claude models and extended thinking when enabled via
 * `modelConfig.thinking = true`.
 */
export class AnthropicProvider extends BaseProvider {
	private readonly client: Anthropic;

	/**
	 * @param apiKey - Anthropic API key.
	 */
	constructor(apiKey: string) {
		super();
		this.client = new Anthropic({ apiKey });
	}

	/** @inheritdoc */
	async generate(
		systemPrompt: string,
		userMessage: string,
		model: string,
		config?: ModelConfig,
	): Promise<LLMResponse> {
		const thinkingEnabled = config?.thinking === true;
		const maxTokens = config?.maxTokens ?? (thinkingEnabled ? 16000 : 8096);

		const params: Anthropic.MessageCreateParamsNonStreaming = {
			model,
			max_tokens: maxTokens,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }],
		};

		if (!thinkingEnabled && config?.temperature !== undefined) {
			params.temperature = config.temperature;
		}

		if (thinkingEnabled) {
			(params as unknown as Record<string, unknown>).thinking = {
				type: 'enabled',
				budget_tokens: Math.min(maxTokens - 1024, 10000),
			};
			params.temperature = 1;
			(params as unknown as Record<string, unknown>).betas = ['interleaved-thinking-2025-05-14'];
		}

		const response = await this.client.messages.create(params);

		let content = '';
		let thinking = '';

		for (const block of response.content ?? []) {
			if ((block as { type: string }).type === 'thinking') {
				thinking += (block as unknown as { thinking: string }).thinking ?? '';
			} else if (block.type === 'text') {
				content += block.text;
			}
		}

		return {
			content,
			thinking: thinking || undefined,
			usage: {
				promptTokens: response.usage.input_tokens,
				completionTokens: response.usage.output_tokens,
				totalTokens: response.usage.input_tokens + response.usage.output_tokens,
			},
			raw: response,
		};
	}
}
