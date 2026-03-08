---
slug: /
sidebar_position: 1
title: Introduction
---

# OpenMolt

**OpenMolt** is a programmatic AI Agent System for Node.js. Define agents, wire them to LLMs and external tools, and run autonomous multi-step workflows — all in TypeScript.

```bash
npm install openmolt
```

---

## What is an agent?

An agent is an autonomous loop. It receives a task, reasons about it with an LLM, calls tools, and repeats until it has a final answer. OpenMolt's loop is called the **Maestro loop**.

```
┌─────────────────────────────────────────┐
│                Maestro Loop             │
│                                         │
│  Input ──► LLM  ──► Commands            │
│              ▲          │               │
│              │          ▼               │
│           History ◄── Execute           │
│                     (tools, waits...)   │
│                          │              │
│                     finish ──► Output   │
└─────────────────────────────────────────┘
```

---

## Key features

| Feature | Description |
|---|---|
| **Multi-provider LLMs** | OpenAI (GPT-4o, o1, o3), Anthropic (Claude), Google (Gemini) |
| **30+ built-in integrations** | Gmail, Slack, Telegram, GitHub, Stripe, Airtable, fal.ai, S3 … |
| **Structured output** | Validate agent output against a Zod schema |
| **Memory** | Long-term and short-term memory stores with persistence callbacks |
| **Scheduling** | Interval and daily cron-style schedules |
| **Custom integrations** | Register your own HTTP or SDK-based tools |
| **TypeScript-first** | Full type inference on configs, schemas, and events |

---

## Quick look

```typescript
import OpenMolt from 'openmolt';
import { z } from 'zod';

const om = new OpenMolt({
  llmProviders: { openai: { apiKey: process.env.OPENAI_API_KEY } },
});

const agent = om.createAgent({
  name: 'Researcher',
  model: 'openai:gpt-4o',
  instructions: 'You are a helpful research assistant.',
  integrations: [
    {
      integration: 'httpRequest',
      credential: { type: 'custom', config: {} },
      scopes: 'all',
    },
  ],
  outputSchema: z.object({ summary: z.string(), sources: z.array(z.string()) }),
});

const result = await agent.run('Summarise the main use cases for WebAssembly.');
console.log(result.summary);
```

---

## Next steps

- **[Getting Started](./getting-started)** — Installation, first agent, and running examples
- **[Agents](./concepts/agents)** — How the Maestro loop works
- **[Integrations](./concepts/integrations)** — Built-in tools and custom integrations
- **[API Reference](./api/)** — Full TypeDoc-generated reference
