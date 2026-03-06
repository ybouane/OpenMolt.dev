/**
 * Example 6: UGC (User-Generated Content) Video Creator
 *
 * Runs once every day at 09:00 (local time). On each tick the agent:
 *   1. Generates a short UGC-style video via fal.ai.
 *   2. Sends the video URL to a Telegram chat.
 *
 * Instructions tell the agent which Telegram chat to target and what
 * kind of content to produce — no code changes needed, just edit below.
 *
 * Prerequisites:
 *   - FAL_API_KEY for video generation
 *   - TELEGRAM_BOT_TOKEN for sending the video
 *   - OPENAI_API_KEY for orchestration
 *
 * Run:
 *   OPENAI_API_KEY=sk-... FAL_API_KEY=... TELEGRAM_BOT_TOKEN=... \
 *   npx tsx examples/06-ugc-creator.ts
 */

import OpenMolt from '../src/index.js';

// ── Configuration — edit these to match your use case ──────────────────────

const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '@your_channel';

const CONTENT_BRIEF = `
Niche: Fitness & Wellness
Style: Motivational UGC, energetic, upbeat
Format: Portrait 9:16, ~5 seconds
Daily theme ideas (rotate through):
  - Morning workout motivation
  - Healthy meal inspiration
  - Mindfulness / breathing tip
  - Progress & consistency mindset
  - Recovery and rest importance
`;

// ───────────────────────────────────────────────────────────────────────────

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
	maxSteps: 20,
});

const agent = om.createAgent({
	name: 'UGCCreator',
	model: 'openai:gpt-4o',
	instructions: `
You are a social media content creator specialising in short UGC-style videos.

Content brief:
${CONTENT_BRIEF}

Telegram chat to post to: ${TELEGRAM_CHAT_ID}

Each time you run, follow these steps:

1. Pick a theme for today's video based on the content brief. Vary themes day to day.

2. Write a vivid, cinematic video prompt (2-3 sentences) that describes:
   - The scene, lighting, and mood
   - Any on-screen action or movement
   - The emotional tone (energetic, calm, inspiring, etc.)

3. Generate the video using the fal integration:
   - Use model "fal-ai/kling-video/v1.6/standard/text-to-video"
   - Set aspect_ratio to "9:16" (portrait for mobile/Reels/TikTok)
   - Set duration to 5

4. Send the generated video URL to Telegram using the telegram integration:
   - Use tool sendVideo with the video URL returned by fal
   - Add a short, engaging caption (1-2 sentences + relevant emoji)
   - Target chat_id: ${TELEGRAM_CHAT_ID}

5. Finish with a brief summary of what was created and posted.
`,
	integrations: [
		{
			integration: 'fal',
			credential: {
				type: 'bearer',
				config: { apiKey: process.env.FAL_API_KEY ?? '' },
			},
			scopes: ['generate'],
		},
		{
			integration: 'telegram',
			credential: {
				type: 'custom',
				config: { apiKey: process.env.TELEGRAM_BOT_TOKEN ?? '' },
			},
			scopes: ['messages'],
		},
	],
});

agent.on('tool:call', ({ tool }) => {
	console.log(`[tool] ${tool.integration}.${tool.handle}`);
});

agent.on('finish', ({ result }) => {
	console.log('[posted]', result);
});

// Run once immediately on startup
await agent.run('Create and post today\'s UGC video.');

// Then schedule daily at 09:00 local time
const scheduleId = agent.schedule({ type: 'daily', hour: 9, minute: 0 });
console.log(`Daily schedule set (id: ${scheduleId}). Next run at 09:00. Press Ctrl+C to stop.`);

process.on('SIGINT', () => {
	agent.cancelSchedule(scheduleId);
	console.log('Schedule cancelled. Exiting.');
	process.exit(0);
});
