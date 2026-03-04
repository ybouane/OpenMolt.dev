/**
 * @module providers/GoogleProvider
 * LLM provider implementation for the Google Generative AI API (Gemini models).
 * Supports standard generation, grounded search, and extended thinking.
 */

import { BaseProvider } from './BaseProvider.js';
import type { ModelConfig, LLMResponse } from '../types/index.js';

/**
 * Google Generative AI (Gemini) LLM provider.
 * Supports Gemini 2.0+, including thinking (Gemini 2.5) and
 * live search grounding.
 */
export class GoogleProvider extends BaseProvider {
	private readonly apiKey: string;

	/**
	 * @param apiKey - Google API key with Generative Language API access.
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
		const searchEnabled = config?.search === true;
		const thinkingEnabled = config?.thinking === true;

		const body: Record<string, unknown> = {
			systemInstruction: {
				parts: [{ text: systemPrompt }],
			},
			contents: [
				{
					role: 'user',
					parts: [{ text: userMessage }],
				},
			],
			generationConfig: {
				temperature: config?.temperature ?? 0.7,
				maxOutputTokens: config?.maxTokens ?? 8192,
				// JSON mode – only set when search is disabled (search requires text mime type)
				...(searchEnabled ? {} : { responseMimeType: 'application/json' }),
			},
		};

		if (thinkingEnabled) {
			(body.generationConfig as Record<string, unknown>).thinkingConfig = {
				thinkingBudget: 10000,
				includeThoughts: true,
			};
		}

		if (searchEnabled) {
			body.tools = [{ googleSearch: {} }];
		}

		const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${this.apiKey}`;

		const response = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Google Generative AI error ${response.status}: ${errText}`);
		}

		const data = (await response.json()) as {
			candidates?: Array<{
				content?: { parts?: Array<{ text?: string; thought?: boolean }> };
			}>;
			usageMetadata?: {
				promptTokenCount: number;
				candidatesTokenCount: number;
				totalTokenCount: number;
			};
		};

		const candidate = data.candidates?.[0];
		let content = '';
		let thinking = '';

		for (const part of candidate?.content?.parts ?? []) {
			if (part.thought) {
				thinking += part.text ?? '';
			} else {
				content += part.text ?? '';
			}
		}

		return {
			content,
			thinking: thinking || undefined,
			usage: {
				promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
				completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
				totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
			},
			raw: data,
		};
	}
}
