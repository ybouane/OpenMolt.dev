/**
 * Example 1: Hello World
 *
 * The simplest possible agent — ask it to tell you a joke.
 *
 * Run:
 *   OPENAI_API_KEY=sk-... npx tsx examples/01-hello-world.ts
 */

import OpenMolt from '../src/index.js';

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
});

const agent = om.createAgent({
	name: 'Comedian',
	model: 'openai:gpt-4o-mini',
	instructions: 'You are a witty stand-up comedian. When asked, tell a short, original joke.',
});

const result = await agent.run('Tell me a joke!');
console.log(result);
