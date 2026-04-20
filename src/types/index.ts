/**
 * @module types
 * Core type definitions for OpenMolt.
 */

import type { ZodTypeAny } from 'zod';

// ─── LLM Provider Config ─────────────────────────────────────────────────────

/** Configuration for a single LLM provider. */
export interface LLMProviderConfig {
	/** API key for the provider. Falls back to the corresponding environment variable. */
	apiKey?: string;
}

/** Top-level OpenMolt configuration. */
export interface OpenMoltConfig {
	/** LLM provider configurations keyed by provider name. */
	llmProviders?: {
		openai?: LLMProviderConfig;
		anthropic?: LLMProviderConfig;
		google?: LLMProviderConfig;
	};
	/** Built-in integration configurations keyed by integration handle. */
	integrations?: Record<string, Record<string, unknown>>;
	/** Maximum number of agent loop iterations before stopping. Defaults to 20. */
	maxSteps?: number;
	/** Enable verbose logging. */
	verbose?: boolean;
}

/** Per-call model configuration passed to the LLM provider. */
export interface ModelConfig {
	/** Enable the model's extended thinking / reasoning process. */
	thinking?: boolean;
	/** Enable web search grounding (Gemini). */
	search?: boolean;
	/** Sampling temperature (0–2). */
	temperature?: number;
	/** Maximum output tokens. */
	maxTokens?: number;
	/** Any additional provider-specific options. */
	[key: string]: unknown;
}

// ─── Integration / Tool Definitions ──────────────────────────────────────────

/** Generic API setup used to configure HTTP tool calls for an integration. */
export interface APISetup {
	/** Base URL prepended to all endpoint paths. Supports Liquid templates with `config.*` variables. */
	baseUrl: string;
	/** Default headers merged into every request. Supports Liquid templates. */
	headers?: Record<string, string>;
	/**
	 * Body serialisation format for outgoing requests.
	 * - `json`: `application/json` (default)
	 * - `url-encoded`: `application/x-www-form-urlencoded` (Stripe, Twilio, etc.)
	 * - `form-data`: multipart/form-data (file uploads)
	 * - `text`: `text/plain`
	 */
	requestFormat?: 'json' | 'url-encoded' | 'form-data' | 'text';
	/** Expected format of API responses. */
	responseFormat?: 'json' | 'text' | 'xml';
}

/** Bearer-token credential setup. */
export interface BearerCredentialSetup {
	type: 'bearer';
	/** Headers to inject (supports `{{ config.* }}` templates). */
	headers: Record<string, string>;
}

/** Custom credential setup with arbitrary header / query-param injection. */
export interface CustomCredentialSetup {
	type: 'custom';
	headers?: Record<string, string>;
	queryParams?: Record<string, string>;
}

/** OAuth 2.0 credential setup. */
export interface OAuth2CredentialSetup {
	type: 'oauth2';
	/** URL to obtain an authorisation code. */
	authUrl: string;
	/** URL used to exchange a refresh token for an access token. */
	tokenUrl: string;
	/** Client identifier template (`{{ config.clientId }}`). */
	clientId: string;
	/** Client secret template. */
	clientSecret: string;
	/** Refresh token template. */
	refreshToken: string;
	/** Scopes required for the token. */
	scopes?: string[];
}

/** Basic Auth credential setup. */
export interface BasicCredentialSetup {
	type: 'basic';
	/** Template for the username field (`{{ config.accountSid }}`). */
	username: string;
	/** Template for the password field. */
	password: string;
}

export type CredentialSetup =
	| BearerCredentialSetup
	| CustomCredentialSetup
	| OAuth2CredentialSetup
	| BasicCredentialSetup;

/** Tool execution context passed to `execute` functions. */
export interface ToolContext {
	/** Name of the agent executing the tool. */
	agentName: string;
	/** Handle of the integration this tool belongs to. */
	integrationHandle: string;
	/** Resolved credential config for the current agent. */
	config?: Record<string, unknown>;
}

/** Definition of a single tool within an integration. */
export interface ToolDefinition {
	/** Unique handle used to identify the tool within its integration. */
	handle: string;
	/** Human-readable description of what the tool does. */
	description: string;
	/** Scopes from the integration's `scopes` map that are required to use this tool. */
	scopes?: string[];

	// HTTP-based tool options (alternative to execute)
	/** HTTP method. */
	method?: string;
	/** Path appended to the integration's `baseUrl`. Supports Liquid templates with `input.*`. */
	endpoint?: string;
	/** Query parameters. Supports Liquid templates. */
	queryParams?: Record<string, unknown>;
	/** Additional headers to merge for this specific tool. */
	headers?: Record<string, unknown>;
	/** Request body. Supports Liquid templates. */
	body?: Record<string, unknown>;

	// Programmatic tool option (alternative to HTTP fields)
	/** Custom async function invoked when the tool is called. Takes precedence over HTTP config. */
	execute?: (input: Record<string, unknown>, context: ToolContext) => Promise<unknown>;

	/** Zod schema describing the expected input object. */
	inputSchema?: ZodTypeAny;
	/** Zod schema describing the expected output object (informational for the agent). */
	outputSchema?: ZodTypeAny;
}

/** Full definition of an integration, including API setup, credential templates, scopes, and tools. */
export interface IntegrationDefinition {
	/** Display name of the integration. */
	name: string;
	/**
	 * Markdown-formatted guidance injected into the agent prompt to help it use the
	 * integration's tools effectively. Should clarify non-obvious input formats,
	 * common workflows, id/handle conventions, and pitfalls that the input/output
	 * schemas alone do not convey.
	 */
	instructions?: string;
	/** Default API configuration used for all HTTP tool calls. */
	apiSetup?: APISetup;
	/** One or more credential schemes supported by the integration. */
	credentialSetup?: CredentialSetup[];
	/** Map of scope name → human-readable description. */
	scopes?: Record<string, string>;
	/** Array of tool definitions exposed by this integration. */
	tools: ToolDefinition[];
}

// ─── Agent Credential Config ──────────────────────────────────────────────────

/** Bearer-token credential assigned to an agent. */
export interface BearerCredential {
	type: 'bearer';
	config: {
		apiKey: string;
		[key: string]: unknown;
	};
}

/** Custom credential assigned to an agent. */
export interface CustomCredential {
	type: 'custom';
	config: Record<string, unknown>;
}

/** OAuth 2.0 credential assigned to an agent. */
export interface OAuth2Credential {
	type: 'oauth2';
	config: {
		clientId: string;
		clientSecret: string;
		refreshToken: string;
		accessToken?: string;
		expiryDate?: string;
		[key: string]: unknown;
	};
	/** Called after every successful token refresh so callers can persist the new tokens. */
	onTokenRefresh?: (newConfig: OAuth2Credential['config']) => Promise<void>;
}

/** Basic Auth credential assigned to an agent. */
export interface BasicCredential {
	type: 'basic';
	config: {
		username: string;
		password: string;
		[key: string]: unknown;
	};
}

export type AgentCredential =
	| BearerCredential
	| CustomCredential
	| OAuth2Credential
	| BasicCredential;

/** Agent-level configuration for a single integration. */
export interface AgentIntegrationConfig {
	/** Handle of the integration to use (must be registered in OpenMolt). */
	integration: string;
	/** Credential information for authenticating with this integration. */
	credential: AgentCredential;
	/** Scopes to restrict access to. Pass `'all'` or omit to allow every scope. */
	scopes?: string[] | 'all';
}

// ─── Memory ───────────────────────────────────────────────────────────────────

/** A memory store with optional update callback. */
export interface MemoryStore {
	/** Initial memory content (plain text or JSON string). */
	data: string;
	/** Called with the new content whenever memory is updated by the agent. */
	onUpdate?: (newData: string) => Promise<void>;
}

/** Agent memory configuration split into long-term and short-term stores. */
export interface MemoryConfig {
	longTerm?: MemoryStore;
	shortTerm?: MemoryStore;
}

// ─── Agent Configuration ──────────────────────────────────────────────────────

/** Full configuration object for creating an agent via `om.createAgent()`. */
export interface AgentConfig {
	/** Display name of the agent. */
	name: string;
	/** Model identifier in the format `provider:model-name` (e.g. `openai:gpt-4o`). */
	model: string;
	/** Per-call model configuration (temperature, thinking, etc.). */
	modelConfig?: ModelConfig;
	/** Override top-level OpenMolt configuration for this agent. */
	config?: Partial<OpenMoltConfig>;
	/** System instructions that guide the agent's behaviour (inline). */
	instructions?: string;
	/** Path to a Markdown file containing the agent's instructions. */
	instructionsPath?: string;
	/** Integrations the agent is allowed to use. */
	integrations?: AgentIntegrationConfig[];
	/** Memory configuration. */
	memory?: MemoryConfig;
	/**
	 * Called when the agent issues a `requestHumanInput` command.
	 * Return the user's reply as a string. Set to `false` to disable human input.
	 */
	onHumanInputRequest?: ((prompt: string) => Promise<string>) | false;
	/** Zod schema the agent's `finish` output must conform to. */
	outputSchema?: ZodTypeAny;
}

// ─── Agent Commands ───────────────────────────────────────────────────────────

/** Command: call a tool from a registered integration. */
export interface CallToolCommand {
	type: 'callTool';
	/** Handle of the integration that owns the tool. */
	integration: string;
	/** Handle of the tool to call. */
	tool: string;
	/** Input object to pass to the tool. */
	input: Record<string, unknown>;
}

/** Command: pause execution for a short period. */
export interface WaitCommand {
	type: 'wait';
	/** Duration in seconds (maximum 60). */
	duration: number;
}

/** Command: replace or append the current execution plan. */
export interface UpdatePlanCommand {
	type: 'updatePlan';
	plan: PlanStep[];
}

/** Command: update long-term or short-term memory. */
export interface UpdateMemoryCommand {
	type: 'updateMemory';
	memoryType: 'longTerm' | 'shortTerm';
	/** `replace` overwrites the entire memory; `append` concatenates to existing content. */
	mode: 'replace' | 'append';
	data: string;
}

/** Command: request input from the human operator (requires `onHumanInputRequest`). */
export interface RequestHumanInputCommand {
	type: 'requestHumanInput';
	prompt: string;
}

/** Command: terminate the agent loop and return a final result. */
export interface FinishCommand {
	type: 'finish';
	output?: unknown;
	status: 'success' | 'failed';
	humanMessage?: string;
}

export type AgentCommand =
	| CallToolCommand
	| WaitCommand
	| UpdatePlanCommand
	| UpdateMemoryCommand
	| RequestHumanInputCommand
	| FinishCommand;

/** The structured JSON response produced by the LLM in each loop iteration. */
export interface AgentLLMResponse {
	commands: AgentCommand[];
}

// ─── Plan ─────────────────────────────────────────────────────────────────────

/** A single sub-step within a plan step. */
export interface PlanSubStep {
	name: string;
	status: 'pending' | 'inProgress' | 'completed' | 'failed';
	notes?: string;
}

/** A single step in the agent's execution plan. */
export interface PlanStep {
	name: string;
	status: 'pending' | 'inProgress' | 'completed' | 'failed';
	notes?: string;
	/** Sub-steps (one level deep only). */
	subSteps?: PlanSubStep[];
}

// ─── Agent State ──────────────────────────────────────────────────────────────

/** An entry in the command execution history. */
export interface CommandHistoryEntry {
	step: number;
	command: AgentCommand;
	result?: unknown;
	error?: string;
}

/** Runtime state maintained across loop iterations. */
export interface AgentState {
	input: unknown;
	plan: PlanStep[];
	memory: {
		longTerm: string;
		shortTerm: string;
	};
	commandHistory: CommandHistoryEntry[];
	currentStep: number;
}

// ─── LLM Response ─────────────────────────────────────────────────────────────

/** Normalised response returned by any LLMProvider. */
export interface LLMResponse {
	/** The text content of the response. */
	content: string;
	/** Optional chain-of-thought / reasoning produced by the model. */
	thinking?: string;
	/** Token usage statistics. */
	usage?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	/** Raw provider response object. */
	raw?: unknown;
}

// ─── Events ───────────────────────────────────────────────────────────────────

/** Union of all agent events for use with `agent.on(...)`. */
export type AgentEventMap = {
	/** Fired after every raw LLM response. */
	llmOutput: { output: LLMResponse };
	/** Fired after the commands for a step are parsed but before execution. */
	commandsQueued: { commands: AgentCommand[] };
	/** Fired just before a tool is executed. */
	'tool:call': { tool: { integration: string; handle: string; input: Record<string, unknown> } };
	/** Fired after a tool returns. */
	'tool:response': {
		tool: { integration: string; handle: string; input: Record<string, unknown> };
		response: unknown;
	};
	/** Fired whenever the agent updates its plan. */
	planUpdate: { plan: PlanStep[] };
	/** Fired when the agent issues a `finish` command. */
	finish: { result: unknown };
};

// ─── Scheduling ───────────────────────────────────────────────────────────────

/** Run the agent every N seconds. */
export interface IntervalSchedule {
	type: 'interval';
	/** Interval in seconds. */
	value: number;
}

/** Run the agent on specific days/times. */
export interface DailySchedule {
	type: 'daily';
	/** Days of the week to run on (0 = Sunday, 6 = Saturday). */
	dayOfWeek?: number[];
	/** Days of the month to run on (1–31). */
	dayOfMonth?: number[];
	/** Hour of the day (0–23). */
	hour: number;
	/** Minute of the hour (0–59). */
	minute: number;
	/** IANA timezone string (defaults to system timezone). */
	timeZone?: string;
}

export type ScheduleConfig = IntervalSchedule | DailySchedule;
