/**
 * @module Agent
 * The Agent class implements the core Maestro reasoning loop.
 * It is created via {@link OpenMolt.createAgent} and exposes a simple
 * `run(input)` API together with event hooks and scheduling support.
 */

import { readFileSync } from 'fs';
import type {
	AgentConfig,
	AgentState,
	AgentCommand,
	AgentLLMResponse,
	AgentEventMap,
	ScheduleConfig,
	LLMResponse,
	PlanStep,
	CommandHistoryEntry,
	OpenMoltConfig,
} from './types/index.js';
import { Integration } from './Integration.js';
import { BaseProvider } from './providers/BaseProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { AnthropicProvider } from './providers/AnthropicProvider.js';
import { GoogleProvider } from './providers/GoogleProvider.js';
import { buildMaestroPrompt, buildInputState, MaestroIntegrationInfo } from './prompts/maestro.js';
import { Scheduler, ScheduleId } from './utils/scheduler.js';
import { logger } from './utils/logger.js';

// ─── Simple typed EventEmitter ────────────────────────────────────────────────

type HandlerMap = {
	[K in keyof AgentEventMap]?: Array<(event: AgentEventMap[K]) => void>;
};

// ─── JSON parsing helpers ─────────────────────────────────────────────────────

function parseAgentResponse(raw: string): AgentLLMResponse {
	// 1. Try direct parse
	try {
		return JSON.parse(raw) as AgentLLMResponse;
	} catch { /* continue */ }

	// 2. Strip markdown code fences and try again
	const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
	if (fenceMatch) {
		try {
			return JSON.parse(fenceMatch[1]) as AgentLLMResponse;
		} catch { /* continue */ }
	}

	// 3. Try JSONL: one JSON object per line, each with its own `commands` array.
	//    Concatenate all `commands` arrays into a single response.
	const jsonl = tryParseJsonl(raw);
	if (jsonl) return jsonl;

	// 4. Extract first JSON object from the text
	const objMatch = raw.match(/\{[\s\S]*\}/);
	if (objMatch) {
		try {
			return JSON.parse(objMatch[0]) as AgentLLMResponse;
		} catch { /* continue */ }
	}

	throw new Error(`Failed to parse agent response as JSON.\nRaw output:\n${raw}`);
}

/**
 * Recover from a common LLM error mode where the model returns JSONL — multiple
 * `{ "commands": [...] }` objects, one per line — instead of a single object.
 * Returns a merged response, or `null` if the input is not valid JSONL of this shape.
 */
function tryParseJsonl(raw: string): AgentLLMResponse | null {
	const lines = raw.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
	if (lines.length < 2) return null;

	const merged: AgentCommand[] = [];
	for (const line of lines) {
		let obj: unknown;
		try {
			obj = JSON.parse(line);
		} catch {
			return null;
		}
		if (!obj || typeof obj !== 'object' || !Array.isArray((obj as AgentLLMResponse).commands)) {
			return null;
		}
		merged.push(...(obj as AgentLLMResponse).commands);
	}
	return { commands: merged };
}

// ─── Agent class ──────────────────────────────────────────────────────────────

/**
 * An autonomous agent that uses the Maestro reasoning loop to complete tasks.
 *
 * Create via {@link OpenMolt.createAgent} rather than instantiating directly.
 *
 * @example
 * ```typescript
 * const agent = om.createAgent({ name: 'Writer', model: 'openai:gpt-4o', instructions: '...' });
 * const result = await agent.run('Write a haiku about TypeScript');
 * ```
 */
export class Agent {
	/** The agent's display name. */
	readonly name: string;

	private readonly config: AgentConfig;
	private readonly omConfig: OpenMoltConfig;
	private readonly integrations: Map<string, Integration>;
	private readonly provider: BaseProvider;
	private readonly modelName: string;
	private readonly maxSteps: number;
	private readonly maestroPrompt: string;
	private readonly scheduler = new Scheduler();
	private _handlers: HandlerMap = {};
	private _scheduleIds: Map<string, ScheduleId> = new Map();
	private _scheduleCounter = 0;

	/**
	 * @param config       - Agent configuration.
	 * @param omConfig     - Parent OpenMolt configuration.
	 * @param integrations - All integrations registered in the OpenMolt instance.
	 */
	constructor(
		config: AgentConfig,
		omConfig: OpenMoltConfig,
		integrations: Map<string, Integration>,
	) {
		this.config = config;
		this.omConfig = { ...omConfig, ...(config.config ?? {}) };
		this.name = config.name;
		this.maxSteps = this.omConfig.maxSteps ?? 20;

		// Resolve instructions from file if needed
		if (config.instructionsPath && !config.instructions) {
			config.instructions = readFileSync(config.instructionsPath, 'utf-8');
		}

		// Parse model string
		const [providerKey, ...modelParts] = config.model.split(':');
		this.modelName = modelParts.join(':') || providerKey;

		// Build LLM provider
		this.provider = this._buildProvider(providerKey);

		// Filter integrations to those the agent has access to
		this.integrations = this._resolveIntegrations(integrations);

		// Build maestro prompt (static, reused across iterations)
		const integrationInfos = this._buildIntegrationInfos(integrations);
		this.maestroPrompt = buildMaestroPrompt({
			agentConfig: config,
			integrations: integrationInfos,
			humanInputEnabled: config.onHumanInputRequest !== false && !!config.onHumanInputRequest,
		});

		if (this.omConfig.verbose) logger.setVerbose(true);
	}

	// ─── Public API ───────────────────────────────────────────────────────────

	/**
	 * Run the agent with the provided input.
	 *
	 * The agent will iterate the Maestro loop until it issues a `finish` command
	 * or the maximum number of steps is reached.
	 *
	 * @param input - Initial input to the agent (string, object, or any serialisable value).
	 * @returns The output from the agent's `finish` command.
	 */
	async run(input: unknown): Promise<unknown> {
		const state: AgentState = {
			input,
			plan: [],
			memory: {
				longTerm: this.config.memory?.longTerm?.data ?? '',
				shortTerm: this.config.memory?.shortTerm?.data ?? '',
			},
			commandHistory: [],
			currentStep: 0,
		};

		logger.info(`[${this.name}] Starting – model: ${this.config.model}, maxSteps: ${this.maxSteps}`);

		for (let step = 0; step < this.maxSteps; step++) {
			state.currentStep = step;
			logger.debug(`[${this.name}] Step ${step + 1}/${this.maxSteps}`);

			// Build the per-iteration user message
			const userMessage = buildInputState(this.config, state);

			// Call the LLM
			let llmResponse: LLMResponse;
			try {
				llmResponse = await this.provider.generate(
					this.maestroPrompt,
					userMessage,
					this.modelName,
					this.config.modelConfig,
				);
			} catch (err) {
				throw new Error(`[${this.name}] LLM call failed on step ${step + 1}: ${String(err)}`);
			}

			this._emit('llmOutput', { output: llmResponse });
			logger.debug(`[${this.name}] LLM usage:`, llmResponse.usage);

			// Parse commands
			let parsed: AgentLLMResponse;
			try {
				parsed = parseAgentResponse(llmResponse.content);
			} catch (err) {
				// Non-fatal: log and let the loop retry on the next step with the error in history
				logger.warn(`[${this.name}] Could not parse LLM response: ${String(err)}`);
				state.commandHistory.push({
					step,
					command: { type: 'wait', duration: 0 },
					error: `Parse error: ${String(err)}`,
				});
				continue;
			}

			if (!Array.isArray(parsed.commands) || parsed.commands.length === 0) {
				logger.warn(`[${this.name}] LLM returned no commands.`);
				continue;
			}

			this._emit('commandsQueued', { commands: parsed.commands });

			// Execute commands in order
			let finished = false;
			let finishResult: unknown;

			for (const command of parsed.commands) {
				const outcome = await this._executeCommand(command, state, step);
				if (outcome.finished) {
					finished = true;
					finishResult = outcome.result;
					break;
				}
			}

			if (finished) {
				this._emit('finish', { result: finishResult });
				return finishResult;
			}
		}

		throw new Error(
			`[${this.name}] Reached maximum steps (${this.maxSteps}) without finishing. ` +
			'Increase maxSteps or simplify the task.',
		);
	}

	/**
	 * Register an event listener.
	 *
	 * @param event   - Event name.
	 * @param handler - Handler function.
	 */
	on<K extends keyof AgentEventMap>(event: K, handler: (e: AgentEventMap[K]) => void): this {
		if (!this._handlers[event]) {
			this._handlers[event] = [] as HandlerMap[K];
		}
		(this._handlers[event] as Array<(e: AgentEventMap[K]) => void>).push(handler);
		return this;
	}

	/**
	 * Remove an event listener.
	 *
	 * @param event   - Event name.
	 * @param handler - The exact handler reference to remove.
	 */
	off<K extends keyof AgentEventMap>(event: K, handler: (e: AgentEventMap[K]) => void): this {
		const list = this._handlers[event] as Array<(e: AgentEventMap[K]) => void> | undefined;
		if (list) {
			const idx = list.indexOf(handler);
			if (idx !== -1) list.splice(idx, 1);
		}
		return this;
	}

	/**
	 * Schedule the agent to run automatically.
	 *
	 * @param config - Schedule configuration (interval or daily).
	 * @returns A schedule ID that can be passed to {@link cancelSchedule}.
	 */
	schedule(config: ScheduleConfig): string {
		const key = `schedule_${++this._scheduleCounter}`;
		const id = this.scheduler.add(config, async () => {
			try {
				logger.info(`[${this.name}] Scheduled run triggered.`);
				await this.run(null);
			} catch (err) {
				logger.error(`[${this.name}] Scheduled run error:`, err);
			}
		});
		this._scheduleIds.set(key, id);
		return key;
	}

	/**
	 * Cancel a previously registered schedule.
	 *
	 * @param scheduleId - ID returned by {@link schedule}.
	 */
	cancelSchedule(scheduleId: string): boolean {
		const id = this._scheduleIds.get(scheduleId);
		if (!id) return false;
		this._scheduleIds.delete(scheduleId);
		return this.scheduler.cancel(id);
	}

	// ─── Private: command execution ──────────────────────────────────────────

	private async _executeCommand(
		command: AgentCommand,
		state: AgentState,
		step: number,
	): Promise<{ finished: boolean; result?: unknown }> {
		const entry: CommandHistoryEntry = { step, command };

		try {
			switch (command.type) {

				case 'callTool': {
					const agentIntegCfg = this.config.integrations?.find(
						(i) => i.integration === command.integration,
					);
					if (!agentIntegCfg) {
						throw new Error(
							`Agent does not have access to integration "${command.integration}".`,
						);
					}
					const integ = this.integrations.get(command.integration);
					if (!integ) {
						throw new Error(`Integration "${command.integration}" is not registered.`);
					}

					this._emit('tool:call', {
						tool: {
							integration: command.integration,
							handle: command.tool,
							input: command.input,
						},
					});
					logger.debug(`[${this.name}] callTool: ${command.integration}.${command.tool}`);

					const result = await integ.executeTool(
						command.tool,
						command.input,
						agentIntegCfg.credential,
						{ agentName: this.name, integrationHandle: command.integration },
					);

					entry.result = result;
					this._emit('tool:response', {
						tool: {
							integration: command.integration,
							handle: command.tool,
							input: command.input,
						},
						response: result,
					});
					break;
				}

				case 'wait': {
					const duration = Math.min(command.duration, 60) * 1000;
					logger.debug(`[${this.name}] Waiting ${command.duration}s`);
					await new Promise((r) => setTimeout(r, duration));
					entry.result = { waited: command.duration };
					break;
				}

				case 'updatePlan': {
					state.plan = command.plan as PlanStep[];
					entry.result = { planUpdated: true };
					this._emit('planUpdate', { plan: state.plan });
					logger.debug(`[${this.name}] Plan updated (${state.plan.length} steps)`);
					break;
				}

				case 'updateMemory': {
					const store = command.memoryType === 'longTerm' ? 'longTerm' : 'shortTerm';
					if (command.mode === 'replace') {
						state.memory[store] = command.data;
					} else {
						state.memory[store] = state.memory[store]
							? `${state.memory[store]}\n${command.data}`
							: command.data;
					}

					// Propagate to caller's onUpdate if defined
					const memCfg = this.config.memory?.[store];
					if (memCfg?.onUpdate) {
						await memCfg.onUpdate(state.memory[store]);
					}

					entry.result = { memoryUpdated: store };
					break;
				}

				case 'requestHumanInput': {
				if (!this.config.onHumanInputRequest || (this.config.onHumanInputRequest as unknown) === false) {
						throw new Error('Human input requested but onHumanInputRequest is not configured.');
					}
					logger.info(`[${this.name}] Requesting human input: ${command.prompt}`);
					const fn = this.config.onHumanInputRequest as (prompt: string) => Promise<string>;
					const response = await fn(command.prompt);
					entry.result = { humanInput: response };
					break;
				}

				case 'finish': {
					entry.result = { finished: true, status: command.status };
					state.commandHistory.push(entry);
					logger.info(`[${this.name}] Finished – status: ${command.status}`);
					return { finished: true, result: command.output };
				}

				default: {
					entry.error = `Unknown command type: ${(command as AgentCommand).type}`;
					logger.warn(`[${this.name}]`, entry.error);
				}
			}
		} catch (err) {
			entry.error = String(err);
			logger.warn(`[${this.name}] Command ${command.type} failed: ${entry.error}`);
		}

		state.commandHistory.push(entry);
		return { finished: false };
	}

	// ─── Private: event emission ──────────────────────────────────────────────

	private _emit<K extends keyof AgentEventMap>(event: K, data: AgentEventMap[K]): void {
		const list = this._handlers[event] as Array<(e: AgentEventMap[K]) => void> | undefined;
		if (list) {
			for (const handler of list) {
				try {
					handler(data);
				} catch (err) {
					logger.error(`[${this.name}] Event handler error for "${event}":`, err);
				}
			}
		}
	}

	// ─── Private: setup helpers ───────────────────────────────────────────────

	private _buildProvider(providerKey: string): BaseProvider {
		const llmCfg = this.omConfig.llmProviders;
		switch (providerKey.toLowerCase()) {
			case 'openai': {
				const key = llmCfg?.openai?.apiKey ?? process.env.OPENMOLT_OPENAI_API_KEY ?? '';
				return new OpenAIProvider(key);
			}
			case 'anthropic': {
				const key = llmCfg?.anthropic?.apiKey ?? process.env.OPENMOLT_ANTHROPIC_API_KEY ?? '';
				return new AnthropicProvider(key);
			}
			case 'google': {
				const key = llmCfg?.google?.apiKey ?? process.env.OPENMOLT_GOOGLE_API_KEY ?? '';
				return new GoogleProvider(key);
			}
			default:
				throw new Error(
					`Unknown LLM provider "${providerKey}". ` +
					'Supported: openai, anthropic, google',
				);
		}
	}

	/** Filter down to only the integrations the agent is allowed to use. */
	private _resolveIntegrations(all: Map<string, Integration>): Map<string, Integration> {
		const result = new Map<string, Integration>();
		if (!this.config.integrations) return result;
		for (const agentIntegCfg of this.config.integrations) {
			const integ = all.get(agentIntegCfg.integration);
			if (integ) result.set(agentIntegCfg.integration, integ);
		}
		return result;
	}

	/** Build the integration info objects used in the Maestro prompt. */
	private _buildIntegrationInfos(all: Map<string, Integration>): MaestroIntegrationInfo[] {
		if (!this.config.integrations) return [];
		const result: MaestroIntegrationInfo[] = [];
		for (const agentIntegCfg of this.config.integrations) {
			const integ = all.get(agentIntegCfg.integration);
			if (!integ) continue;
			result.push({
				handle: integ.handle,
				name: integ.definition.name,
				definition: integ.definition,
				agentConfig: agentIntegCfg,
			});
		}
		return result;
	}
}
