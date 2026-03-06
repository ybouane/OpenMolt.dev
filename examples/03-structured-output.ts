/**
 * Example 3: Structured Output
 *
 * Uses the built-in `httpRequest` integration to fetch a webpage and extract
 * the logo image URL. The agent's output is validated against a Zod schema,
 * so `agent.run()` returns a typed object rather than a plain string.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... npx tsx examples/03-structured-output.ts
 */

import { z } from 'zod';
import OpenMolt from '../src/index.js';

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
});

// Define the shape of the output we expect from the agent
const LogoSchema = z.object({
	logoUrl: z.string().url().describe('Absolute URL of the site logo image'),
	altText: z.string().optional().describe('Alt text of the logo image, if present'),
	confidence: z.enum(['high', 'medium', 'low']).describe('How confident the agent is in the extracted URL'),
});

const agent = om.createAgent({
	name: 'LogoExtractor',
	model: 'openai:gpt-4o',
	instructions: `
You are a web-scraping assistant. When given a URL:
1. Use the httpRequest integration to fetch the page HTML.
2. Scan the HTML for logo images — look for <img> tags with "logo" in the class, id, src,
   or alt attribute, as well as <link rel="icon"> / <link rel="apple-touch-icon"> tags.
3. Return the most likely logo URL as an absolute URL (prepend the site origin if needed).
`,
	integrations: [
		{
			integration: 'httpRequest',
			credential: { type: 'custom', config: {} },
			scopes: 'all',
		},
	],
	outputSchema: LogoSchema,
});

const result = await agent.run('Extract the logo image URL from https://a.genti.ca/') as z.infer<typeof LogoSchema>;

console.log('Logo URL:   ', result.logoUrl);
console.log('Alt text:   ', result.altText ?? '(none)');
console.log('Confidence: ', result.confidence);
