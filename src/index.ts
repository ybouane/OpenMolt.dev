/**
 * @module openmolt
 * OpenMolt – Programmatic AI Agent System.
 *
 * @example
 * ```typescript
 * import OpenMolt from 'openmolt';
 * import { z } from 'zod';
 *
 * const om = new OpenMolt({
 *   llmProviders: { openai: { apiKey: 'sk-...' } },
 *   maxSteps: 15,
 * });
 *
 * const agent = om.createAgent({
 *   name: 'Researcher',
 *   model: 'openai:gpt-4o',
 *   instructions: 'You are a helpful research assistant.',
 *   outputSchema: z.object({ summary: z.string() }),
 * });
 *
 * const result = await agent.run('Summarise the key benefits of TypeScript.');
 * console.log(result);
 * ```
 */

// ─── Main class ───────────────────────────────────────────────────────────────
export { OpenMolt } from './OpenMolt.js';
export { OpenMolt as default } from './OpenMolt.js';

// ─── Core classes ─────────────────────────────────────────────────────────────
export { Agent } from './Agent.js';
export { Integration } from './Integration.js';
export { BaseProvider } from './providers/BaseProvider.js';
export { OpenAIProvider } from './providers/OpenAIProvider.js';
export { AnthropicProvider } from './providers/AnthropicProvider.js';
export { GoogleProvider } from './providers/GoogleProvider.js';

// ─── Built-in integrations ────────────────────────────────────────────────────
export * from './integrations/index.js';

// ─── Types ────────────────────────────────────────────────────────────────────
export type {
	// Config
	OpenMoltConfig,
	LLMProviderConfig,
	ModelConfig,
	AgentConfig,
	// Integration
	IntegrationDefinition,
	ToolDefinition,
	ToolContext,
	APISetup,
	CredentialSetup,
	BearerCredentialSetup,
	CustomCredentialSetup,
	OAuth2CredentialSetup,
	BasicCredentialSetup,
	// Credentials
	AgentCredential,
	BearerCredential,
	CustomCredential,
	OAuth2Credential,
	BasicCredential,
	AgentIntegrationConfig,
	// Memory
	MemoryConfig,
	MemoryStore,
	// Commands
	AgentCommand,
	CallToolCommand,
	WaitCommand,
	UpdatePlanCommand,
	UpdateMemoryCommand,
	RequestHumanInputCommand,
	FinishCommand,
	AgentLLMResponse,
	// Plan
	PlanStep,
	PlanSubStep,
	// State
	AgentState,
	CommandHistoryEntry,
	// LLM
	LLMResponse,
	// Events
	AgentEventMap,
	// Schedule
	ScheduleConfig,
	IntervalSchedule,
	DailySchedule,
} from './types/index.js';
