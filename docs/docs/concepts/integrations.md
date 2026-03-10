---
sidebar_position: 2
title: Integrations
---

# Integrations

An **integration** is a named collection of tools an agent can call. Each tool maps to either an HTTP endpoint (via Liquid-template config) or a custom `execute` function.

## Built-in integrations

OpenMolt ships with 30 integrations pre-registered:

| Handle | Service |
|---|---|
| `airtable` | Airtable REST API |
| `browserUse` | Headless browser / web automation |
| `discord` | Discord Bot API |
| `dropbox` | Dropbox API |
| `etsy` | Etsy API |
| `fal` | fal.ai (image & video generation) |
| `geminiMediaModels` | Google Gemini media generation |
| `github` | GitHub REST API |
| `gmail` | Gmail API (OAuth2) |
| `googleAds` | Google Ads API |
| `googleCalendar` | Google Calendar API |
| `googleDrive` | Google Drive API |
| `googleSheets` | Google Sheets API |
| `httpRequest` | Generic HTTP requests |
| `instagram` | Instagram Graph API |
| `metaAds` | Meta Ads API |
| `microsoftOutlook` | Microsoft Outlook / Graph API |
| `notion` | Notion API |
| `openAiMediaModels` | OpenAI Media Models API (DALL·E) |
| `s3` | Amazon S3 |
| `shopify` | Shopify Admin API |
| `slack` | Slack Web API |
| `stripe` | Stripe API |
| `telegram` | Telegram Bot API |
| `tiktok` | TikTok API |
| `twilio` | Twilio REST API |
| `x` | X (Twitter) API v2 |
| `whatsapp` | WhatsApp Business API |
| `youtube` | YouTube Data API |
| `fileSystem` | Local filesystem (factory — see below) |

## Assigning integrations to an agent

```typescript
const agent = om.createAgent({
  integrations: [
    {
      integration: 'slack',
      credential: {
        type: 'bearer',
        config: { apiKey: process.env.SLACK_BOT_TOKEN },
      },
      scopes: ['messages', 'channels'],   // or 'all'
    },
  ],
});
```

`scopes` restricts which tools the agent can call. Pass `'all'` or omit to allow every scope.

## Credential types

| Type | Required fields | Used by |
|---|---|---|
| `bearer` | `config.apiKey` | Slack, Telegram, GitHub, Stripe … |
| `oauth2` | `config.clientId`, `clientSecret`, `refreshToken` | Gmail, Google Drive … |
| `basic` | `config.username`, `config.password` | Twilio |
| `custom` | any `config` fields | httpRequest, fileSystem, custom APIs |

OAuth2 credentials are automatically refreshed; pass `onTokenRefresh` to persist the new tokens.

## FileSystem integration

The FileSystem integration is a **factory** — not auto-registered — so you choose which directories are accessible:

```typescript
om.registerIntegration(
  'fileSystem',
  OpenMolt.FileSystemIntegration('./output'),   // restrict to ./output
);

// or multiple directories
om.registerIntegration(
  'fileSystem',
  OpenMolt.FileSystemIntegration(['./data', './uploads']),
);
```

## Custom integrations

Register any HTTP API as a custom integration:

```typescript
om.registerIntegration('myApi', {
  name: 'My Service',
  apiSetup: {
    baseUrl: 'https://api.myservice.com/v1',
    headers: { Authorization: 'Bearer {{ config.apiKey }}' },
    requestFormat: 'json',
    responseFormat: 'json',
  },
  credentialSetup: [{ type: 'bearer', headers: { Authorization: 'Bearer {{ config.apiKey }}' } }],
  scopes: { read: 'Read data', write: 'Write data' },
  tools: [
    {
      handle: 'getUser',
      description: 'Get a user by ID.',
      scopes: ['read'],
      method: 'GET',
      endpoint: '/users/{{ input.id }}',
      inputSchema: z.object({ id: z.string() }),
    },
  ],
});
```

For tools that cannot be expressed as a single HTTP call (file uploads, SDK calls, multi-step auth), use an `execute` function:

```typescript
{
  handle: 'uploadFile',
  description: 'Upload a file.',
  execute: async (input, context) => {
    const apiKey = context.config?.apiKey as string;
    // ... custom logic
    return { url: '…' };
  },
  inputSchema: z.object({ path: z.string() }),
}
```
