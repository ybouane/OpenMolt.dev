/**
 * Example 5: Blog Post Creator
 *
 * Given a topic, the agent:
 *   1. Writes a full Markdown blog post.
 *   2. Generates relevant images via fal.ai (flux/schnell).
 *   3. Saves the .md file and all images to a local ./blog/ folder
 *      using the FileSystem integration.
 *
 * Prerequisites:
 *   - FAL_API_KEY for image generation
 *   - OPENAI_API_KEY for writing
 *
 * Run:
 *   OPENAI_API_KEY=sk-... FAL_API_KEY=... \
 *   npx ts-node examples/05-blog-post-creator.ts
 */

import OpenMolt from '../src/index.js';

const BLOG_DIR = './blog';

const om = new OpenMolt({
	llmProviders: {
		openai: { apiKey: process.env.OPENAI_API_KEY },
	},
	maxSteps: 40,
});

// Register a FileSystem integration restricted to the ./blog output folder
om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration(BLOG_DIR));

const agent = om.createAgent({
	name: 'BlogWriter',
	model: 'openai:gpt-4o',
	instructions: `
You are an expert content writer and creative director that produces high-quality blog posts.

When given a topic, follow these steps:

1. Plan the article:
   - Choose a compelling title and slug (kebab-case, e.g. "the-future-of-ai").
   - Outline 4-6 sections with descriptive headings.
   - Decide on 2-3 image concepts that would complement the article.

2. Write the full Markdown article:
   - Start with a front-matter block: title, date (today), and a one-sentence description.
   - Write engaging, well-structured prose for each section (~200 words each).
   - Leave image placeholders like ![Alt text](./images/image-1.jpg) where images will go.

3. Generate images using the fal integration:
   - Use model "fal-ai/flux/schnell" for each image concept.
   - Use image_size "landscape_4_3".
   - After generating each image, note its CDN URL.

4. Save files using the fileSystem integration:
   - Create the directory "./images" inside the blog folder if needed.
   - Save the Markdown file as "./{slug}.md" — replace the image placeholders with
     the actual fal CDN URLs (the filesystem only needs the .md file; images are CDN-hosted).
   - Confirm each file was saved successfully.

5. Finish with a summary listing the output file path and all image URLs.
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
			integration: 'fileSystem',
			credential: { type: 'custom', config: {} },
			scopes: ['read', 'write'],
		},
	],
});

agent.on('tool:call', ({ tool }) => {
	console.log(`[tool] ${tool.integration}.${tool.handle}`);
});

const topic = process.argv[2] ?? 'The Future of Human-AI Collaboration in Creative Work';

console.log(`Writing blog post about: "${topic}"`);
console.log(`Output directory: ${BLOG_DIR}/\n`);

const result = await agent.run(`Write a blog post about: ${topic}`);
console.log('\n[result]', result);
