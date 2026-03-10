# OpenMolt

**Programmatic AI Agent System for Node.js / TypeScript**

OpenMolt lets your code create autonomous AI agents that plan, reason, and act — calling real APIs, reading files, generating images, sending messages, and more. Agents run a self-directed reasoning loop (the *Maestro* loop) powered by any LLM until the task is complete.

```
npm install openmolt
```

→ **[openmolt.dev](https://openmolt.dev/)** — full documentation, API reference, and examples

---

## Why OpenMolt?

| | |
|---|---|
| **Secure by design** | Agents access only the scopes you grant. The LLM sees tool names — never raw credentials |
| **Multi-provider** | OpenAI, Anthropic Claude, and Google Gemini with a unified `provider:model` string |
| **30+ built-in integrations** | Gmail, Slack, GitHub, Notion, Stripe, Discord, S3, and more — ready out of the box |
| **Declarative HTTP tools** | Define integrations as data (endpoint, auth, Liquid templates) — no boilerplate |
| **Typed output** | Pass a Zod schema; `agent.run()` returns a validated, typed object |
| **Scheduling** | Interval and cron-style daily schedules with timezone support |
| **Events** | Observable reasoning loop — hook into every tool call, plan update, and LLM output |
| **Memory** | Long-term and short-term memory stores with `onUpdate` persistence callbacks |
| **CLI** | `npx openmolt agent.json` to run agents from a config file |
---

## Secure by Design

OpenMolt was built with security as a first-class constraint, not an afterthought.

**Scope-gated tools.** Every integration is granted an explicit list of scopes when you attach it to an agent. If a tool requires the `write` scope and you only granted `read`, the agent cannot call it — regardless of what the LLM decides.

```typescript
integrations: [
  {
    integration: 'gmail',
    credential: { type: 'oauth2', config: { ... } },
    scopes: ['read'],   // agent can read emails, but cannot send or delete
  },
],
```

**Credentials never reach the LLM.** The model only sees tool names and their input/output schemas. Your API keys, tokens, and OAuth secrets are resolved server-side at execution time — the LLM prompt contains none of them.

**Directory-restricted filesystem.** The `FileSystem` integration is a factory that you instantiate with an explicit allowlist of directories. The agent cannot read or write outside those paths.

```typescript
om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('./output'));
// agent cannot access /etc, ~/, or any path outside ./output
```

**No implicit network access.** Agents can only call APIs that are registered as integrations. There is no general-purpose outbound HTTP unless you explicitly add the `httpRequest` integration.

---

## Quick Start

```typescript
import OpenMolt from 'openmolt';

const om = new OpenMolt({
  llmProviders: {
    openai: { apiKey: process.env.OPENMOLT_OPENAI_API_KEY },
  },
});

const agent = om.createAgent({
  name: 'Comedian',
  model: 'openai:gpt-4o-mini',
  instructions: 'You are a witty stand-up comedian.',
});

const result = await agent.run('Tell me a joke!');
console.log(result);
```

**Environment variables** (no config needed):

| Variable | Provider |
|---|---|
| `OPENMOLT_OPENAI_API_KEY` | OpenAI |
| `OPENMOLT_ANTHROPIC_API_KEY` | Anthropic |
| `OPENMOLT_GOOGLE_API_KEY` | Google Gemini |

---

## Model Strings

Choose any LLM with `provider:model-name`:

```typescript
model: 'openai:gpt-4o'
model: 'openai:o3-mini'
model: 'anthropic:claude-opus-4-6'
model: 'anthropic:claude-sonnet-4-6'
model: 'google:gemini-2.0-flash'
model: 'google:gemini-2.5-pro'
```

Optional per-model config:

```typescript
modelConfig: {
  thinking: true,      // Extended thinking (Anthropic / Gemini)
  search: true,        // Grounded web search (Gemini)
  temperature: 0.7,
}
```

---

## Examples

### Structured output with a Zod schema

```typescript
import { z } from 'zod';
import OpenMolt from 'openmolt';

const om = new OpenMolt({ llmProviders: { openai: {} } });

const LogoSchema = z.object({
  logoUrl:    z.string().url(),
  altText:    z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const agent = om.createAgent({
  name: 'LogoExtractor',
  model: 'openai:gpt-4o',
  instructions: 'Fetch the page with httpRequest and extract the logo URL.',
  integrations: [
    { integration: 'httpRequest', credential: { type: 'custom', config: {} }, scopes: 'all' },
  ],
  outputSchema: LogoSchema,
});

const result = await agent.run('https://example.com') as z.infer<typeof LogoSchema>;
console.log(result.logoUrl, result.confidence);
```

---

### Gmail draft generator that runs on a schedule

```typescript
import OpenMolt from 'openmolt';

const om = new OpenMolt({ llmProviders: { openai: {} }, maxSteps: 30 });

const agent = om.createAgent({
  name: 'GmailDraftBot',
  model: 'openai:gpt-4o',
  instructions: `
    Fetch the 10 most recent unread emails.
    For each one, draft a professional reply using gmail → createDraft.
    Finish with a summary of how many drafts were created.
  `,
  integrations: [
    {
      integration: 'gmail',
      credential: {
        type: 'oauth2',
        config: {
          clientId:     process.env.GOOGLE_CLIENT_ID ?? '',
          clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
          refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? '',
        },
        onTokenRefresh: async (newConfig) => { /* persist tokens */ },
      },
      scopes: 'all',
    },
  ],
});

agent.on('tool:call', ({ tool }) =>
  console.log(`[tool] ${tool.integration}.${tool.handle}`)
);

// Run once now, then every 20 minutes
await agent.run('Process unread emails.');
const id = agent.schedule({ type: 'interval', value: 20 * 60 });

process.on('SIGINT', () => { agent.cancelSchedule(id); process.exit(0); });
```

---

### Blog post writer with AI-generated images

```typescript
import OpenMolt from 'openmolt';

const om = new OpenMolt({ llmProviders: { openai: {} }, maxSteps: 40 });

// Restrict filesystem access to ./blog only
om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('./blog'));

const agent = om.createAgent({
  name: 'BlogWriter',
  model: 'openai:gpt-4o',
  instructions: `
    1. Write a full Markdown blog post with front-matter.
    2. Generate 2-3 images with fal → generate (fal-ai/flux/schnell).
    3. Save the .md file to fileSystem with the fal CDN image URLs inline.
    4. Finish with the output path and image URLs.
  `,
  integrations: [
    { integration: 'fal',        credential: { type: 'bearer', config: { apiKey: process.env.FAL_API_KEY ?? '' } }, scopes: 'all' },
    { integration: 'fileSystem', credential: { type: 'custom', config: {} }, scopes: ['read', 'write'] },
  ],
});

const result = await agent.run('Write a blog post about the future of AI agents.');
console.log(result);
```

---

### Custom integration (declarative HTTP)

```typescript
import OpenMolt, { IntegrationDefinition } from 'openmolt';
import { z } from 'zod';

const weatherDefinition: IntegrationDefinition = {
  name: 'Weather',
  apiSetup: {
    baseUrl: 'https://api.openweathermap.org/data/2.5',
    headers: { 'Content-Type': 'application/json' },
    responseFormat: 'json',
  },
  credentialSetup: [{ type: 'custom', queryParams: { appid: '{{ config.apiKey }}' } }],
  tools: [
    {
      handle: 'getCurrentWeather',
      description: 'Get current weather for a city.',
      method: 'GET',
      endpoint: '/weather',
      queryParams: { q: '{{ input.city }}', units: 'metric' },
      inputSchema:  z.object({ city: z.string() }),
      outputSchema: z.object({ temp: z.number(), description: z.string() }),
    },
  ],
};

const om = new OpenMolt({ llmProviders: { anthropic: {} } });
om.registerIntegration('weather', weatherDefinition);

const agent = om.createAgent({
  name: 'WeatherBot',
  model: 'anthropic:claude-sonnet-4-6',
  instructions: 'Answer questions about the current weather.',
  integrations: [
    { integration: 'weather', credential: { type: 'custom', config: { apiKey: process.env.WEATHER_API_KEY ?? '' } }, scopes: 'all' },
  ],
});

console.log(await agent.run('What is the weather in Tokyo?'));
```

---

### Daily scheduling with memory

```typescript
const agent = om.createAgent({
  name: 'ReportBot',
  model: 'google:gemini-2.0-flash',
  instructions: 'Pull metrics from Stripe and post a daily summary to Slack.',
  memory: {
    longTerm: {
      data: '',
      onUpdate: async (data) => await fs.writeFile('memory.txt', data),
    },
  },
  integrations: [
    { integration: 'stripe', credential: { type: 'bearer', config: { apiKey: process.env.STRIPE_SECRET_KEY ?? '' } }, scopes: 'all' },
    { integration: 'slack',  credential: { type: 'bearer', config: { apiKey: process.env.SLACK_BOT_TOKEN ?? '' } },  scopes: 'all' },
  ],
});

// Every weekday at 9 AM New York time
agent.schedule({
  type: 'daily',
  dayOfWeek: [1, 2, 3, 4, 5],
  hour: 9, minute: 0,
  timeZone: 'America/New_York',
});
```

---

## Built-in Integrations

| Category | Integrations |
|---|---|
| **Productivity** | Notion, Airtable, Google Calendar, Google Drive, Google Sheets, Microsoft Outlook |
| **Communication** | Gmail, Slack, Discord, Telegram, WhatsApp, Twilio |
| **Social / Content** | X (Twitter), Instagram, TikTok, YouTube |
| **AI / Media** | fal.ai, Google Imagen + Veo (Gemini Media Models), OpenAI Media Models (DALL-E / gpt-image-1) |
| **Commerce** | Stripe, Shopify, Etsy |
| **Dev & Cloud** | GitHub, AWS S3, Dropbox |
| **Ads** | Google Ads, Meta Ads |
| **Web** | browser-use.com (cloud browsing), Generic HTTP Request |
| **Local** | FileSystem (directory-restricted) |

---

## Events

Observe every step of the agent's reasoning:

```typescript
agent.on('llmOutput',      ({ output })         => console.log('LLM tokens used:', output.usage));
agent.on('commandsQueued', ({ commands })        => console.log('Next commands:', commands.length));
agent.on('tool:call',      ({ tool })            => console.log('Calling:', tool.integration, tool.handle));
agent.on('tool:response',  ({ tool, response })  => console.log('Response:', response));
agent.on('planUpdate',     ({ plan })            => console.log('Plan updated:', plan));
agent.on('finish',         ({ result })          => console.log('Done:', result));
```

---

## CLI

Run an agent from a JSON or JS config file:

```bash
npx openmolt agent.json
npx openmolt agent.json --input "Summarise this week's Stripe revenue" --verbose
npx openmolt agent.json --dry-run   # validate without running
```

**agent.json**

```json
{
  "llmProviders": { "openai": { "apiKey": "sk-..." } },
  "integrations": { "slack": { "apiKey": "xoxb-..." } },
  "agent": {
    "name": "SlackBot",
    "model": "openai:gpt-4o",
    "instructions": "Post a motivational message to #general every morning.",
    "integrations": [
      { "integration": "slack", "credential": { "type": "bearer", "config": {} }, "scopes": "all" }
    ],
    "schedules": [
      { "type": "daily", "hour": 8, "minute": 0, "timeZone": "UTC" }
    ]
  }
}
```

---

## Documentation

Full docs, API reference, and more examples at **[openmolt.dev](https://openmolt.dev/)**.

---

## License

MIT
