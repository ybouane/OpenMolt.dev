/**
 * Example 2: Instructions from a Markdown file
 *
 * Loads the agent's system prompt from an external .md file using `instructionsPath`.
 * This keeps long prompts out of your code and makes them easy to version separately.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... npx ts-node examples/02-instructions-from-file/index.ts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenMolt from '../../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
});

const agent = om.createAgent({
	name: 'Chef',
	model: 'openai:gpt-4o-mini',
	// Instructions are loaded from the adjacent markdown file at runtime
	instructionsPath: join(__dirname, 'instructions.md'),
});

const result = await agent.run(
	'I have chicken breast, garlic, lemon, olive oil, and fresh rosemary. What can I make?',
);
console.log(result);
