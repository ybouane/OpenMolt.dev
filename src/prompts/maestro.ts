/**
 * @module prompts/maestro
 * Builds the Maestro system prompt that governs the agent's reasoning loop.
 * The prompt is fully self-contained – all context the model needs is embedded
 * in the prompt so it can operate without any external state besides what is
 * provided here.
 */

import type { AgentConfig, AgentIntegrationConfig, IntegrationDefinition } from '../types/index.js';
import { schemaToString } from '../utils/schema.js';

/** A registered integration together with its handle and filtered tools. */
export interface MaestroIntegrationInfo {
	handle: string;
	name: string;
	definition: IntegrationDefinition;
	agentConfig: AgentIntegrationConfig;
}

/** All parameters needed to construct the Maestro prompt. */
export interface MaestroPromptParams {
	agentConfig: AgentConfig;
	integrations: MaestroIntegrationInfo[];
	humanInputEnabled: boolean;
}

/**
 * Build the static Maestro **system** prompt.
 * This is generated once per agent and reused across all loop iterations.
 *
 * @param params - Agent config and resolved integration metadata.
 * @returns The full system prompt string.
 */
export function buildMaestroPrompt(params: MaestroPromptParams): string {
	const { agentConfig, integrations, humanInputEnabled } = params;

	const toolsSection = buildToolsSection(integrations);
	const outputSchemaSection = agentConfig.outputSchema
		? `\n## Output Schema\nThe \`finish\` command's \`output\` field MUST conform to this JSON Schema:\n\`\`\`json\n${schemaToString(agentConfig.outputSchema)}\n\`\`\`\n`
		: '';

	const humanInputSection = humanInputEnabled
		? `\n### requestHumanInput\nRequest clarification or additional information from a human operator. Use this **sparingly** – only when all other options are exhausted.\n\`\`\`json\n{ "type": "requestHumanInput", "prompt": "<question for the user>" }\n\`\`\`\n`
		: '';

	return `# Maestro Agent Runtime

You are an autonomous AI agent operating inside the OpenMolt runtime. Your sole job is to complete the task described in the user message below by issuing a sequence of **commands** that will be executed by the runtime on your behalf.

## Critical Output Rule
You MUST respond with **valid JSON only** – no markdown, no prose, no code fences.
The response MUST be a single JSON object with a \`commands\` array:

\`\`\`
{ "commands": [
	command1,
	command2,
	...
] }
\`\`\`

Remember that you must output a single JSON object with a \`commands\` array, and nothing else. Do not output multiple JSON objects, and do not include any text outside the JSON.

Any response that is not parseable JSON, or that does not contain a top-level \`commands\` array, will cause the runtime to terminate with an error.

---

## Available Commands

### callTool
Invoke a tool from one of your available integrations.
\`\`\`json
{
  "type": "callTool",
  "integration": "<integrationHandle>",
  "tool": "<toolHandle>",
  "input": { ... }
}
\`\`\`
The \`input\` object must match the tool's declared input schema. The tool's response will be appended to the command history before the next iteration.

### wait
Pause execution for up to **60 seconds**.
\`\`\`json
{ "type": "wait", "duration": <seconds: 1-60> }
\`\`\`

### updatePlan
Overwrite your current execution plan. Call this at the start and whenever your understanding of the task changes.
\`\`\`json
{
  "type": "updatePlan",
  "plan": [
    {
      "name": "Step description",
      "status": "pending | inProgress | completed | failed",
      "notes": "Optional details / error messages",
      "subSteps": [
        { "name": "Sub-step", "status": "pending", "notes": "" }
      ]
    }
  ]
}
\`\`\`
Rules: maximum **one level** of sub-steps; every step must have a \`status\`.

### updateMemory
Persist information for later use.
\`\`\`json
{
  "type": "updateMemory",
  "memoryType": "longTerm | shortTerm",
  "mode": "replace | append",
  "data": "<content to store>"
}
\`\`\`
- **longTerm**: Survives across multiple \`run()\` calls. Use for facts, credentials, learned preferences.
- **shortTerm**: Scoped to the current run. Use for intermediate results and working notes.
- **replace**: Completely overwrites the store.
- **append**: Concatenates to the existing content.
${humanInputSection}
### finish
Terminate execution and return a result.
\`\`\`json
{
  "type": "finish",
  "output": { ... },
  "status": "success | failed",
  "humanMessage": "Optional message for the end user"
}
\`\`\`
${outputSchemaSection}
---

## Execution Principles
1. **Plan first**: Issue an \`updatePlan\` in your first response to lay out the steps.
2. **Think step-by-step**: Reason about what information you have and what you need before choosing a command.
3. **Use tools strategically**: Only call tools when needed; avoid redundant calls.
4. **Handle errors gracefully**: If a tool fails, update the plan step to \`failed\`, note the error, and try to recover or fall back.
5. **Update your plan**: Mark steps as \`inProgress\` when you start them and \`completed\` / \`failed\` when they finish.
6. **Multiple commands per turn**: You may issue multiple commands in a single response (in the commands array) – they execute in order, left-to-right.
7. **Efficiency**: Prefer \`callTool\` commands in parallel (i.e. multiple \`callTool\` entries in one response) when the calls are independent.
8. **No placeholders — every command must be fully resolved**: Every field of every command you emit must contain its final, real value. Do **not** emit placeholder strings like \`"<id from previous step>"\`, \`"TBD"\`, \`"$result.foo"\`, \`"<fill in later>"\`, \`null\` standing in for unknown data, or template-style references to other commands' outputs. The runtime executes commands literally — it does **not** substitute values between them. If a command depends on data you do not yet have (e.g. an ID returned by an earlier \`callTool\`), do **not** include that command in this turn. Emit only the commands whose inputs you fully know right now, end the turn, and wait for the next iteration: the previous commands' results will appear in the command history, and you can then issue the dependent commands with their real values filled in. It is correct and expected to take multiple turns to chain dependent calls.
9. **Finish when done**: Issue \`finish\` as soon as the task is complete. Do **not** issue further commands after \`finish\`.

---
${toolsSection}
---

## Agent Identity
**Name**: ${agentConfig.name}
**Model**: ${agentConfig.model}
`;
}

// ─── Tools Section ────────────────────────────────────────────────────────────

function buildToolsSection(integrations: MaestroIntegrationInfo[]): string {
	if (integrations.length === 0) return '## Available Tools\n_No integrations configured._\n';

	const lines: string[] = ['## Available Tools'];

	for (const info of integrations) {
		const allowedScopes = info.agentConfig.scopes;
		lines.push(`\n### Integration: \`${info.handle}\` — ${info.name}`);

		for (const tool of info.definition.tools) {
			// Filter by scopes
			if (allowedScopes && allowedScopes !== 'all' && tool.scopes) {
				const hasScope = tool.scopes.some((s) => (allowedScopes as string[]).includes(s));
				if (!hasScope) continue;
			}

			lines.push(`\n#### \`${tool.handle}\``);
			lines.push(tool.description);

			if (tool.inputSchema) {
				lines.push(`\n**Input Schema:**\n\`\`\`json\n${schemaToString(tool.inputSchema)}\n\`\`\``);
			}
			if (tool.outputSchema) {
				lines.push(`\n**Output Schema:**\n\`\`\`json\n${schemaToString(tool.outputSchema)}\n\`\`\``);
			}
		}
	}

	return lines.join('\n');
}

// ─── Input State (per-iteration user message) ─────────────────────────────────

import type { AgentState } from '../types/index.js';

/**
 * Build the **user message** injected at the start of each loop iteration.
 * It contains the agent's task, current plan, memory, and command history.
 */
export function buildInputState(
	agentConfig: AgentConfig,
	state: AgentState,
): string {
	const lines: string[] = [];

	lines.push('## Task');
	lines.push(typeof state.input === 'string' ? state.input : JSON.stringify(state.input, null, 2));

	lines.push('\n## Instructions');
	lines.push(agentConfig.instructions ?? '_No instructions provided._');

	lines.push('\n## Current Plan');
	lines.push(state.plan.length > 0
		? JSON.stringify(state.plan, null, 2)
		: '_No plan yet. Please create one._');

	lines.push('\n## Memory');
	lines.push(`**Long-term:**\n${state.memory.longTerm || '_empty_'}`);
	lines.push(`\n**Short-term:**\n${state.memory.shortTerm || '_empty_'}`);

	lines.push(`\n## Iteration\nStep ${state.currentStep + 1}`);

	if (state.commandHistory.length > 0) {
		lines.push('\n## Command History (most recent last)');
		// Include only the last 20 entries to keep the context manageable
		const history = state.commandHistory.slice(-20);
		for (const entry of history) {
			lines.push(`\n### Step ${entry.step + 1} – ${entry.command.type}`);
			lines.push('**Command:**');
			lines.push('```json');
			lines.push(JSON.stringify(entry.command, null, 2));
			lines.push('```');
			if (entry.error) {
				lines.push(`**Error:** ${entry.error}`);
			} else if (entry.result !== undefined) {
				const resultStr = JSON.stringify(entry.result, null, 2);
				// Truncate very large results
				const truncated = resultStr.length > 4000
					? resultStr.slice(0, 4000) + '\n... [truncated]'
					: resultStr;
				lines.push('**Result:**');
				lines.push('```json');
				lines.push(truncated);
				lines.push('```');
			}
		}
	}

	return lines.join('\n');
}
