/**
 * @module providers/GoogleProvider
 * LLM provider implementation for Google Generative AI (Gemini models).
 * Uses the official `@google/genai` SDK.
 * Supports standard generation, grounded search, and extended thinking.
 */

import { GoogleGenAI } from '@google/genai';
import { BaseProvider } from './BaseProvider.js';
import type { ModelConfig, LLMResponse } from '../types/index.js';

/**
 * Google Generative AI (Gemini) LLM provider.
 * Supports Gemini 2.0+, including thinking (Gemini 2.5) and
 * live search grounding.
 */
export class GoogleProvider extends BaseProvider {
	private readonly client: GoogleGenAI;

	/**
	 * @param apiKey - Google API key with Generative Language API access.
	 */
	constructor(apiKey: string) {
		super();
		this.client = new GoogleGenAI({ apiKey });
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

		const genConfig: Record<string, unknown> = {
			temperature: config?.temperature ?? 0.7,
			maxOutputTokens: config?.maxTokens ?? 8192,
			responseMimeType: 'application/json',
		};

		if (thinkingEnabled) {
			genConfig.thinkingConfig = {
				thinkingBudget: 10000,
				includeThoughts: true,
			};
		}

		const tools = searchEnabled ? [{ googleSearch: {} }] : undefined;

		const response = await this.client.models.generateContent({
			model,
			contents: [{ role: 'user', parts: [{ text: userMessage }] }],
			config: {
				systemInstruction: systemPrompt,
				...genConfig,
				...(tools ? { tools } : {}),
			},
		});

		const candidate = response.candidates?.[0];
		let content = '';
		let thinking = '';

		for (const part of candidate?.content?.parts ?? []) {
			if ((part as Record<string, unknown>).thought) {
				thinking += part.text ?? '';
			} else {
				content += part.text ?? '';
			}
		}

		const usage = response.usageMetadata;

		return {
			content,
			thinking: thinking || undefined,
			usage: {
				promptTokens: (usage as Record<string, number> | undefined)?.promptTokenCount ?? 0,
				completionTokens: (usage as Record<string, number> | undefined)?.candidatesTokenCount ?? 0,
				totalTokens: (usage as Record<string, number> | undefined)?.totalTokenCount ?? 0,
			},
			raw: response,
		};
	}
}
