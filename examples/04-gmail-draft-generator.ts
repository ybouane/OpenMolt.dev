/**
 * Example 4: Gmail Draft Generator
 *
 * Runs on a schedule every 20 minutes. On each tick the agent:
 *   1. Fetches the 10 most recent unread emails from the inbox.
 *   2. For each email, searches the inbox for related prior threads that
 *      could serve as context for a reply.
 *   3. Drafts a reply using Gmail's draft API (never sends automatically).
 *
 * Prerequisites:
 *   - A Google OAuth2 application with the Gmail API enabled.
 *   - A refresh token with scopes: gmail.readonly + gmail.compose
 *
 * Run:
 *   GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REFRESH_TOKEN=... \
 *   OPENAI_API_KEY=sk-... \
 *   npx ts-node examples/04-gmail-draft-generator.ts
 */

import OpenMolt from '../src/index.js';

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
	maxSteps: 30,
});

const agent = om.createAgent({
	name: 'GmailDraftBot',
	model: 'openai:gpt-4o',
	instructions: `
You are an email assistant that helps draft replies to incoming emails.

Every time you run, follow these steps:

1. Call gmail → listMessages with query "is:unread in:inbox" and maxResults 10
   to get the latest unread emails.

2. For each unread message retrieved:
   a. Call gmail → getMessage to get the full content (subject, sender, body).
   b. Call gmail → listMessages with a query that searches for the sender's email
      address or the email subject in previous messages to find relevant context.
   c. Based on the original email and any context found, compose a professional,
      helpful draft reply.
   d. Call gmail → createDraft to save the draft (do NOT send it).

3. Once all emails have been processed, finish with a summary of how many drafts
   were created.

Be concise and professional in your drafts. Match the tone of the original email.
If an email doesn't need a reply (newsletter, notification, etc.) skip it.
`,
	integrations: [
		{
			integration: 'gmail',
			credential: {
				type: 'oauth2',
				config: {
					clientId: process.env.GOOGLE_CLIENT_ID ?? '',
					clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
					refreshToken: process.env.GOOGLE_REFRESH_TOKEN ?? '',
				},
			},
			scopes: ['all'],
		},
	],
});

// Log every tool call so we can see what the agent is doing
agent.on('tool:call', ({ tool }) => {
	console.log(`[tool] ${tool.integration}.${tool.handle}`, JSON.stringify(tool.input).slice(0, 120));
});

agent.on('finish', ({ result }) => {
	console.log('[done]', result);
});

// Run once immediately, then every 20 minutes
await agent.run('Process unread emails and create draft replies.');

const scheduleId = agent.schedule({ type: 'interval', value: 20 * 60 });
console.log(`Scheduled (id: ${scheduleId}). Press Ctrl+C to stop.`);

// Keep the process alive
process.on('SIGINT', () => {
	agent.cancelSchedule(scheduleId);
	console.log('Schedule cancelled. Exiting.');
	process.exit(0);
});
