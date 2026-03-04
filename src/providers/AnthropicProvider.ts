/**
 * @module providers/AnthropicProvider
 * LLM provider implementation for the Anthropic API (Claude models).
 */

import { BaseProvider } from './BaseProvider.js';
import type { ModelConfig, LLMResponse } from '../types/index.js';

/**
 * Anthropic LLM provider.
 * Supports all Claude models and extended thinking when enabled via
 * `modelConfig.thinking = true`.
 */
export class AnthropicProvider extends BaseProvider {
	private readonly apiKey: string;

	/**
	 * @param apiKey - Anthropic API key.
	 */
	constructor(apiKey: string) {
		super();
		this.apiKey = apiKey;
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

		const body: Record<string, unknown> = {
			model,
			max_tokens: maxTokens,
			system: systemPrompt,
			messages: [{ role: 'user', content: userMessage }],
		};

		if (!thinkingEnabled && config?.temperature !== undefined) {
			body.temperature = config.temperature;
		}

		if (thinkingEnabled) {
			body.thinking = {
				type: 'enabled',
				budget_tokens: Math.min(maxTokens - 1024, 10000),
			};
			// temperature must be 1 when thinking is enabled
			body.temperature = 1;
		}

		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'x-api-key': this.apiKey,
			'anthropic-version': '2023-06-01',
		};

		if (thinkingEnabled) {
			headers['anthropic-beta'] = 'interleaved-thinking-2025-05-14';
		}

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Anthropic API error ${response.status}: ${errText}`);
		}

		const data = (await response.json()) as {
			content: Array<{ type: string; thinking?: string; text?: string }>;
			usage?: { input_tokens: number; output_tokens: number };
		};

		let content = '';
		let thinking = '';

		for (const block of data.content ?? []) {
			if (block.type === 'thinking' && block.thinking) {
				thinking += block.thinking;
			} else if (block.type === 'text' && block.text) {
				content += block.text;
			}
		}

		return {
			content,
			thinking: thinking || undefined,
			usage: {
				promptTokens: data.usage?.input_tokens ?? 0,
				completionTokens: data.usage?.output_tokens ?? 0,
				totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
			},
			raw: data,
		};
	}
}
