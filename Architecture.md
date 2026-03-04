# OpenMolt Architecture

## Overview

OpenMolt is a programmatic AI agent framework for Node.js/TypeScript. It provides a minimal, modular API for creating autonomous agents that use large language models (LLMs) to plan and execute multi-step tasks via **integrations** (tool collections backed by external APIs or local resources).

---

## Core Concepts

| Concept | Description |
|---|---|
| **OpenMolt** | Top-level singleton; manages LLM configuration, integration registry, and agent creation. |
| **Agent** | A stateful runner that drives the Maestro reasoning loop for a single task. |
| **Integration** | A named collection of tools with shared API setup and credential templates. |
| **Tool** | A single callable action within an integration (HTTP request or custom `execute` function). |
| **LLMProvider** | Abstraction over an LLM API (OpenAI, Anthropic, Google). |
| **Scheduler** | Manages interval and daily cron-style scheduled agent runs. |

---

## Directory Structure

```
src/
├── index.ts                  # Public package entry point
├── OpenMolt.ts               # Main class – registers integrations, creates agents
├── Agent.ts                  # Agent class – Maestro loop, event emission, scheduling
├── Integration.ts            # Integration class – HTTP tool execution, OAuth2 refresh
│
├── types/
│   └── index.ts              # All shared TypeScript interfaces and types
│
├── providers/
│   ├── BaseProvider.ts       # Abstract LLM provider interface
│   ├── OpenAIProvider.ts     # OpenAI GPT / o-series
│   ├── AnthropicProvider.ts  # Anthropic Claude (+ extended thinking)
│   └── GoogleProvider.ts     # Google Gemini (+ thinking + grounded search)
│
├── prompts/
│   └── maestro.ts            # Maestro system-prompt builder + per-iteration input-state builder
│
├── utils/
│   ├── liquid.ts             # LiquidJS template rendering (type-preserving substitution)
│   ├── logger.ts             # Levelled logger
│   ├── scheduler.ts          # Interval and daily scheduler
│   └── schema.ts             # Zod → simple JSON Schema converter for prompts
│
├── integrations/
│   ├── index.ts              # Re-exports all built-in integration definitions
│   ├── notion.ts             # Notion API
│   ├── fal.ts                # fal.ai (SDK-based)
│   ├── googleCalendar.ts     # Google Calendar API
│   ├── gmail.ts              # Gmail API
│   ├── googleDrive.ts        # Google Drive API
│   ├── googleSheets.ts       # Google Sheets API
│   ├── microsoftOutlook.ts   # Microsoft Graph (Outlook / Calendar)
│   ├── geminiMedia.ts        # Google Imagen 3 + Veo 3 (via Gemini API)
│   ├── openaiImages.ts       # OpenAI DALL-E / gpt-image-1
│   ├── discord.ts            # Discord Bot API
│   ├── slack.ts              # Slack Web API
│   ├── telegram.ts           # Telegram Bot API
│   ├── whatsapp.ts           # WhatsApp Business Cloud API
│   ├── twitter.ts            # Twitter/X API v2
│   ├── instagram.ts          # Instagram Graph API
│   ├── twilio.ts             # Twilio (SMS, Voice, Verify)
│   ├── airtable.ts           # Airtable REST API
│   ├── tiktok.ts             # TikTok Content + Research API
│   ├── youtube.ts            # YouTube Data API v3
│   ├── s3.ts                 # AWS S3 (via @aws-sdk/client-s3)
│   ├── shopify.ts            # Shopify Admin API
│   ├── stripe.ts             # Stripe API
│   ├── etsy.ts               # Etsy Open API v3
│   ├── github.ts             # GitHub REST API
│   ├── dropbox.ts            # Dropbox API v2
│   ├── googleAds.ts          # Google Ads API
│   ├── metaAds.ts            # Meta Marketing API
│   ├── browserUse.ts         # browser-use.com Cloud API
│   ├── httpRequest.ts        # Generic HTTP request tool
│   └── fileSystem.ts         # Local filesystem (directory-restricted)
│
└── cli/
    └── index.ts              # npx openmolt <config.json> CLI entry point
```

---

## Maestro Reasoning Loop

The core of every agent run is a stateful loop capped at `maxSteps` iterations:

```
┌─────────────────────────────────────┐
│  Agent.run(input)                   │
│                                     │
│  State: { input, plan, memory,      │
│           commandHistory, step }    │
│                                     │
│  for step in 0..maxSteps:           │
│    ┌─────────────────────────────┐  │
│    │  Build user message         │  │
│    │  (input state snapshot)     │  │
│    └────────────┬────────────────┘  │
│                 │                   │
│    ┌────────────▼────────────────┐  │
│    │  LLMProvider.generate()     │  │
│    │  system: Maestro prompt     │  │
│    │  user:   input state        │  │
│    └────────────┬────────────────┘  │
│                 │                   │
│    ┌────────────▼────────────────┐  │
│    │  Parse JSON response        │  │
│    │  { "commands": [ ... ] }    │  │
│    └────────────┬────────────────┘  │
│                 │                   │
│    ┌────────────▼────────────────┐  │
│    │  Execute commands in order  │  │
│    │  → callTool                 │  │
│    │  → wait                     │  │
│    │  → updatePlan               │  │
│    │  → updateMemory             │  │
│    │  → requestHumanInput        │  │
│    │  → finish ──────────────────┼──┼──► return result
│    └─────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### Agent Commands

| Command | Description |
|---|---|
| `callTool` | Execute a tool from a registered integration |
| `wait` | Pause for up to 60 seconds |
| `updatePlan` | Replace the current execution plan |
| `updateMemory` | Append or replace long-term / short-term memory |
| `requestHumanInput` | Ask the human operator for clarification |
| `finish` | Return the final output and end the loop |

---

## Integration Architecture

Each integration is a plain `IntegrationDefinition` object that can be registered statically or at runtime.

### HTTP Tool Execution Flow

```
Agent issues callTool command
       │
       ▼
Integration.executeTool(handle, input, credential)
       │
       ├── tool.execute? → call directly (SDK-based tools)
       │
       └── HTTP path:
           1. Render baseUrl  with Liquid { config }
           2. Render endpoint with Liquid { input, config }
           3. Resolve auth headers from credential type:
              - bearer  → Authorization: Bearer {accessToken}
              - oauth2  → auto-refresh if expired, then Bearer
              - basic   → Authorization: Basic base64(user:pass)
              - custom  → render headers/queryParams templates
           4. Render body / queryParams with Liquid { input, config }
              - {{ input.field }} → direct type-preserving substitution
              - other Liquid expressions → string rendering
           5. fetch(url, { method, headers, body })
           6. Parse response (json / text)
```

### Liquid Template Scopes

| Template | Context Variable | Example |
|---|---|---|
| Credential headers | `config.*` | `Authorization: Bearer {{ config.apiKey }}` |
| API baseUrl | `config.*` | `https://api.telegram.org/bot{{ config.apiKey }}` |
| Tool endpoint | `input.*` | `/users/{{ input.userId }}/posts` |
| Tool body | `input.*` | `{ "text": "{{ input.message }}" }` |
| Tool queryParams | `input.*` | `{ "q": "{{ input.query }}" }` |

**Type preservation**: A field set to exactly `{{ input.someField }}` (and nothing else) will receive the original JavaScript value without string coercion, preserving `number`, `boolean`, and `object` types.

---

## Credential Types

| Type | How auth is applied |
|---|---|
| `bearer` | `Authorization: Bearer <token>` via header template `{{ config.apiKey }}` |
| `basic` | `Authorization: Basic <base64(username:password)>` constructed at runtime |
| `custom` | Arbitrary header / query-param templates rendered with `config.*` variables |
| `oauth2` | Access token maintained automatically; refresh token exchanged when expired |

### OAuth 2.0 Token Refresh

The `Integration` class automatically refreshes OAuth 2.0 access tokens:
1. On every tool call, checks if `config.expiryDate` is within 60 seconds of expiry.
2. If so, POSTs to the integration's `tokenUrl` with the refresh token.
3. Updates `credential.config.accessToken` and `credential.config.expiryDate` in place.
4. Calls `onTokenRefresh(newConfig)` so callers can persist the new tokens.
5. Uses a `WeakMap` to deduplicate concurrent refresh requests (race condition prevention).

---

## LLM Provider Model String Format

Agents specify their model as `provider:model-name`:

| Model String | Provider | Notes |
|---|---|---|
| `openai:gpt-4o` | OpenAI | JSON mode enabled |
| `openai:o3-mini` | OpenAI | Reasoning model; no temperature |
| `anthropic:claude-opus-4-6` | Anthropic | Optional extended thinking |
| `google:gemini-2.0-flash` | Google | Optional grounded search & thinking |

---

## Memory Model

| Store | Scope | Use case |
|---|---|---|
| `longTerm` | Persists across `run()` calls via `onUpdate` callback | Learned facts, preferences, summarised history |
| `shortTerm` | Scoped to a single `run()` call | Working notes, intermediate results, step outputs |

Both stores are plain strings (typically plain text or serialised JSON) passed verbatim into the agent's input state each iteration.

---

## Event System

`Agent` emits typed events that callers subscribe to with `.on(event, handler)`:

| Event | Payload | When |
|---|---|---|
| `llmOutput` | `{ output: LLMResponse }` | After each raw LLM response |
| `commandsQueued` | `{ commands }` | After parsing, before execution |
| `tool:call` | `{ tool: { integration, handle, input } }` | Before tool execution |
| `tool:response` | `{ tool, response }` | After tool returns |
| `planUpdate` | `{ plan }` | When agent calls `updatePlan` |
| `finish` | `{ result }` | When agent calls `finish` |

---

## Scheduling

`agent.schedule(config)` returns a schedule ID and registers the agent for automatic execution:

```typescript
// Run every hour
agent.schedule({ type: 'interval', value: 3600 });

// Run at 9 AM EST on weekdays
agent.schedule({
  type: 'daily',
  dayOfWeek: [1, 2, 3, 4, 5],
  hour: 9, minute: 0,
  timeZone: 'America/New_York',
});
```

The `Scheduler` class polls once per minute for daily triggers and uses `setInterval` for interval triggers.

---

## CLI

```
npx openmolt agentConfig.json [options]

--input <str>   Initial input to pass to agent.run()
--dry-run       Validate config without running
--verbose       Enable debug logging
--help          Show help
```

Config file supports:
- `llmProviders` – API keys (overridden by `OPENMOLT_*` env vars)
- `integrations` – per-integration config passed to credential resolution
- `agent` – full agent configuration including `schedules[]`
- `input` – default initial input

---

## Adding a New Integration

1. Create `src/integrations/myService.ts` exporting `myServiceDefinition: IntegrationDefinition`.
2. Add the export to `src/integrations/index.ts`.
3. Import and register in `src/OpenMolt.ts` within `BUILTIN_INTEGRATIONS`.

For SDK-based integrations (like fal.ai or S3), use `execute` functions. For REST APIs, prefer the declarative HTTP approach with Liquid templates.

---

## Security Considerations

- **FileSystem integration**: All paths are validated with `path.resolve()` against the configured allowed directories. Traversal attacks are blocked.
- **Credential injection**: Credential values are never embedded in URLs; they are always injected via headers or POST body.
- **maxSteps**: Every agent has a hard cap on iterations to prevent infinite loops.
- **Tool timeouts**: The generic HTTP request tool supports a configurable timeout.
- **OAuth2 secrets**: Refresh tokens are stored in memory only; persistence is the caller's responsibility via `onTokenRefresh`.
