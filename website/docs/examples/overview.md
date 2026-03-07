---
sidebar_position: 1
title: Overview
---

# Examples

The `examples/` directory in the repository contains six runnable examples. Clone the repo and run any example with `npx tsx`:

```bash
git clone https://github.com/openmolt/openmolt
cd openmolt
npm install
OPENAI_API_KEY=sk-... npx tsx examples/01-hello-world.ts
```

---

## 01 — Hello World

The simplest possible agent. No integrations, no schema — just a model, instructions, and a run call.

```typescript
const agent = om.createAgent({
  name: 'Comedian',
  model: 'openai:gpt-4o-mini',
  instructions: 'You are a witty stand-up comedian.',
});

const result = await agent.run('Tell me a joke!');
console.log(result);
```

**File:** [`examples/01-hello-world.ts`](https://github.com/openmolt/openmolt/blob/main/examples/01-hello-world.ts)

---

## 02 — Instructions from a file

Loads the agent's system prompt from a Markdown file via `instructionsPath`. Useful for long prompts that you want to version and edit separately from code.

```typescript
const agent = om.createAgent({
  name: 'Chef',
  model: 'openai:gpt-4o-mini',
  instructionsPath: join(__dirname, 'instructions.md'),
});
```

**File:** [`examples/02-instructions-from-file/`](https://github.com/openmolt/openmolt/blob/main/examples/02-instructions-from-file/)

---

## 03 — Structured Output

Uses the `httpRequest` integration to fetch a webpage and extracts the logo URL. The output is validated against a Zod schema.

```typescript
const LogoSchema = z.object({
  logoUrl: z.string().url(),
  altText: z.string().optional(),
  confidence: z.enum(['high', 'medium', 'low']),
});

const agent = om.createAgent({
  outputSchema: LogoSchema,
  integrations: [{ integration: 'httpRequest', … }],
});

const result = await agent.run('Extract the logo from https://a.genti.ca/');
console.log(result.logoUrl);
```

**File:** [`examples/03-structured-output.ts`](https://github.com/openmolt/openmolt/blob/main/examples/03-structured-output.ts)

---

## 04 — Gmail Draft Generator

Scheduled every 20 minutes. Scans the 10 latest unread emails, searches prior threads for context, and creates draft replies — never sending automatically.

Uses the `gmail` integration with OAuth2 credentials.

```typescript
const id = agent.schedule({ type: 'interval', value: 20 * 60 });
```

**File:** [`examples/04-gmail-draft-generator.ts`](https://github.com/openmolt/openmolt/blob/main/examples/04-gmail-draft-generator.ts)

---

## 05 — Blog Post Creator

Given a topic, the agent writes a full Markdown article, generates header images with fal.ai, and saves everything to a `./blog/` directory using the FileSystem integration.

```bash
OPENAI_API_KEY=sk-... FAL_API_KEY=... \
  npx tsx examples/05-blog-post-creator.ts "The Future of AI Agents"
```

**File:** [`examples/05-blog-post-creator.ts`](https://github.com/openmolt/openmolt/blob/main/examples/05-blog-post-creator.ts)

---

## 06 — UGC Creator (Scheduled Daily)

Generates a short UGC-style video via fal.ai every day at 09:00 and posts it to a Telegram channel. Content brief is configured in the agent's instructions — no code changes needed to change the niche or style.

```typescript
const id = agent.schedule({ type: 'daily', hour: 9, minute: 0 });
```

**File:** [`examples/06-ugc-creator.ts`](https://github.com/openmolt/openmolt/blob/main/examples/06-ugc-creator.ts)
