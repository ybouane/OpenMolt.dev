/**
 * @module providers/BaseProvider
 * Abstract base class for all LLM provider implementations.
 * Concrete providers (OpenAI, Anthropic, Google) extend this class.
 */

import type { ModelConfig, LLMResponse } from '../types/index.js';

/**
 * Abstract base for all language-model providers.
 * Implementations are responsible for translating the normalised
 * `systemPrompt` / `userMessage` / `config` inputs into the provider's own
 * API format and returning a normalised {@link LLMResponse}.
 */
export abstract class BaseProvider {
	/**
	 * Send a prompt to the underlying LLM and return a normalised response.
	 *
	 * @param systemPrompt - The Maestro system prompt (static across iterations).
	 * @param userMessage  - The per-iteration input-state message.
	 * @param model        - Provider-specific model identifier (e.g. `gpt-4o`).
	 * @param config       - Optional model-level tuning parameters.
	 */
	abstract generate(
		systemPrompt: string,
		userMessage: string,
		model: string,
		config?: ModelConfig,
	): Promise<LLMResponse>;
}
