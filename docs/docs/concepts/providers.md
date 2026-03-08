---
sidebar_position: 3
title: LLM Providers
---

# LLM Providers

OpenMolt supports three LLM providers out of the box. Select the provider with the model string prefix.

## OpenAI

```typescript
const om = new OpenMolt({
  llmProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY },
  },
});
```

Supported models:

| Model string | Notes |
|---|---|
| `openai:gpt-4o` | Default choice — fast, capable |
| `openai:gpt-4o-mini` | Cheaper, great for simple tasks |
| `openai:o1` / `openai:o3` | Reasoning models — no system prompt, no temperature |
| `openai:o4-mini` | Compact reasoning model |

Reasoning models (`o1`, `o3`, `o4-mini`, …) are detected automatically. They use `max_completion_tokens` instead of `max_tokens` and the system prompt is merged into the user message.

**Custom base URL** (proxies, Azure OpenAI):

```typescript
llmProviders: {
  openai: { apiKey: '…', baseUrl: 'https://my-proxy.example.com/v1' },
},
```

## Anthropic

```typescript
const om = new OpenMolt({
  llmProviders: {
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
  },
});
```

| Model string | Notes |
|---|---|
| `anthropic:claude-opus-4-6` | Most capable Claude model |
| `anthropic:claude-sonnet-4-6` | Balanced speed / capability |
| `anthropic:claude-haiku-4-5-20251001` | Fastest, lowest cost |

Enable **extended thinking** via `modelConfig`:

```typescript
const agent = om.createAgent({
  model: 'anthropic:claude-opus-4-6',
  modelConfig: { thinking: true, maxTokens: 16000 },
});
```

When `thinking: true` the response's chain-of-thought is exposed on `LLMResponse.thinking`.

## Google Gemini

```typescript
const om = new OpenMolt({
  llmProviders: {
    google: { apiKey: process.env.GOOGLE_API_KEY },
  },
});
```

| Model string | Notes |
|---|---|
| `google:gemini-2.0-flash` | Fast, multimodal |
| `google:gemini-2.5-pro` | Most capable Gemini model |

Enable **web search grounding** via `modelConfig`:

```typescript
const agent = om.createAgent({
  model: 'google:gemini-2.0-flash',
  modelConfig: { search: true },
});
```

## Using multiple providers

Instantiate one `OpenMolt` with all keys configured; each agent picks its own model:

```typescript
const om = new OpenMolt({
  llmProviders: {
    openai:    { apiKey: process.env.OPENAI_API_KEY },
    anthropic: { apiKey: process.env.ANTHROPIC_API_KEY },
    google:    { apiKey: process.env.GOOGLE_API_KEY },
  },
});

const planner = om.createAgent({ model: 'openai:o3',                  … });
const writer  = om.createAgent({ model: 'anthropic:claude-opus-4-6',  … });
const searcher = om.createAgent({ model: 'google:gemini-2.0-flash',   … });
```
