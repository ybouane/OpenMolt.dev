---
sidebar_position: 1
title: Agents
---

# Agents

An **agent** is an autonomous reasoning loop backed by an LLM. You describe _what_ to do; the agent figures out _how_.

## The Maestro Loop

Each iteration of the loop proceeds as follows:

1. **Build context** — the agent assembles a structured JSON snapshot: current plan, memory, command history, available tools, and the latest results.
2. **LLM call** — the context is sent to the configured model. The model responds with a JSON array of **commands**.
3. **Execute commands** — each command is processed in order (tool calls, memory updates, wait, finish, etc.).
4. **Check termination** — if a `finish` command is received, the loop ends and the output is returned; otherwise the loop repeats.

The loop runs for at most `maxSteps` iterations (default 20).

## Agent configuration

```typescript
const agent = om.createAgent({
  // Required
  name: 'MyAgent',
  model: 'openai:gpt-4o',

  // Instructions (inline or from file)
  instructions: 'You are a …',
  instructionsPath: './instructions.md',   // alternative to inline

  // Model tuning
  modelConfig: {
    temperature: 0.3,
    maxTokens: 4096,
    thinking: true,    // extended thinking (Anthropic models)
    search: true,      // web search grounding (Gemini models)
  },

  // Integrations the agent may call
  integrations: [ … ],

  // Structured output validation
  outputSchema: z.object({ … }),

  // Memory
  memory: {
    longTerm:  { data: '…', onUpdate: async (d) => persist(d) },
    shortTerm: { data: '' },
  },

  // Human-in-the-loop (omit or set false to disable)
  onHumanInputRequest: async (prompt) => readline(prompt),

  // Override global OpenMolt config for this agent
  config: { maxSteps: 50, verbose: true },
});
```

## Commands

The LLM can emit the following commands each loop iteration:

| Command | Description |
|---|---|
| `callTool` | Execute a registered integration tool |
| `updatePlan` | Replace or extend the current step list |
| `updateMemory` | Write to long-term or short-term memory |
| `wait` | Pause for N seconds (max 60) |
| `requestHumanInput` | Ask the operator a question |
| `finish` | End the loop with a result and status |

## Running an agent

```typescript
// One-shot
const result = await agent.run('Summarise this week's GitHub PRs.');

// With input object
const result = await agent.run({ repo: 'openmolt/openmolt', since: '2025-01-01' });
```

`agent.run()` resolves when a `finish` command is issued. If `outputSchema` is set, the finish output is validated and the typed value is returned.
