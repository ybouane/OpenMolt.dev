---
sidebar_position: 2
title: Getting Started
---

# Getting Started

## Installation

```bash
npm install openmolt
```

Set your LLM provider API key as an environment variable:

```bash
export OPENAI_API_KEY=sk-...
# or
export ANTHROPIC_API_KEY=sk-ant-...
# or
export GOOGLE_API_KEY=AIza...
```

OpenMolt also reads `OPENMOLT_OPENAI_API_KEY`, `OPENMOLT_ANTHROPIC_API_KEY`, and `OPENMOLT_GOOGLE_API_KEY` if the standard names aren't set.

---

## Hello World

```typescript title="hello.ts"
import OpenMolt from 'openmolt';

const om = new OpenMolt({
  llmProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
});

const agent = om.createAgent({
  name: 'Bot',
  model: 'openai:gpt-4o-mini',
  instructions: 'You are a friendly assistant.',
});

const result = await agent.run('Tell me a fun fact about octopuses.');
console.log(result);
```

Run it:

```bash
npx tsx hello.ts
```

---

## Model string format

Models are identified as `provider:model-name`:

| String | Provider | Model |
|---|---|---|
| `openai:gpt-4o` | OpenAI | GPT-4o |
| `openai:gpt-4o-mini` | OpenAI | GPT-4o mini |
| `openai:o3` | OpenAI | o3 (reasoning) |
| `anthropic:claude-opus-4-6` | Anthropic | Claude Opus 4.6 |
| `anthropic:claude-sonnet-4-6` | Anthropic | Claude Sonnet 4.6 |
| `google:gemini-2.0-flash` | Google | Gemini 2.0 Flash |

---

## Structured output

Pass a Zod schema to `outputSchema` and the agent's finish value will be validated against it:

```typescript
import { z } from 'zod';

const agent = om.createAgent({
  name: 'Extractor',
  model: 'openai:gpt-4o',
  instructions: 'Extract structured data as instructed.',
  outputSchema: z.object({
    title: z.string(),
    year: z.number().int(),
    genre: z.array(z.string()),
  }),
});

const movie = await agent.run('Tell me about Blade Runner 2049.');
console.log(movie.year); // 2017
```

---

## Using integrations

Give agents access to external APIs by listing integrations in `AgentConfig`:

```typescript
const agent = om.createAgent({
  name: 'EmailBot',
  model: 'openai:gpt-4o',
  instructions: 'Help manage emails.',
  integrations: [
    {
      integration: 'gmail',
      credential: {
        type: 'oauth2',
        config: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
        },
      },
      scopes: 'all',    // or ['read', 'send']
    },
  ],
});
```

---

## Instructions from a file

For long system prompts, load them from a Markdown file:

```typescript
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const agent = om.createAgent({
  name: 'Expert',
  model: 'anthropic:claude-sonnet-4-6',
  instructionsPath: join(__dirname, 'instructions.md'),
});
```

---

## Scheduling

Run an agent on a recurring schedule:

```typescript
// Every 30 minutes
const id = agent.schedule({ type: 'interval', value: 30 * 60 });

// Daily at 08:30 UTC
const id2 = agent.schedule({ type: 'daily', hour: 8, minute: 30 });

// Cancel when done
agent.cancelSchedule(id);
```

---

## Events

Listen to agent lifecycle events:

```typescript
agent.on('tool:call', ({ tool }) => {
  console.log(`Calling ${tool.integration}.${tool.handle}`);
});

agent.on('tool:response', ({ tool, response }) => {
  console.log(`Response from ${tool.handle}:`, response);
});

agent.on('finish', ({ result }) => {
  console.log('Done:', result);
});

agent.on('planUpdate', ({ plan }) => {
  console.log('Plan updated:', plan.map(s => s.name));
});
```
