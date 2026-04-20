/**
 * @module integrations/openAiMediaModels
 * OpenAI Media Models API integration definition (DALL-E 2, DALL-E 3, GPT-Image-1).
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const openAiMediaModelsDefinition: IntegrationDefinition = {
	name: 'OpenAI Media Models',
	instructions: `
### Model choice
- \`gpt-image-1\` — newest, best quality, supports transparency/format control, most expensive.
- \`dall-e-3\` — strong prompt adherence, \`n\` must be \`1\`, supports \`style\` (\`vivid\` | \`natural\`), supports \`hd\` quality.
- \`dall-e-2\` — cheapest, supports \`n\` up to 10, only square sizes (\`256/512/1024\`), and is the **only** model for \`createVariation\`.

Default behaviour is \`dall-e-2\`. Prefer \`dall-e-3\` for single high-quality renders and \`gpt-image-1\` when you need transparency or format control.

### Sizes
- dall-e-3: \`1024x1024\`, \`1792x1024\`, \`1024x1792\`.
- dall-e-2 & variations: \`256x256\`, \`512x512\`, \`1024x1024\` only.
- gpt-image-1: \`1024x1024\`, \`1024x1536\`, \`1536x1024\`, \`auto\`.

Passing an unsupported size fails with a 400.

### response_format
- \`url\` (default) — returns a temporary OpenAI CDN URL that **expires in ~1 hour**. Download and persist if you need it longer.
- \`b64_json\` — image embedded in the response as base64. Use when piping directly into another tool that accepts base64; skips a round-trip but uses much more context/memory.

### editImage
- Provide **one of** \`imageUrl\` or \`imageBase64\` — not both. Same rule for the mask.
- Source image: **PNG, ≤4 MB**. For dall-e-2 edits it must be square.
- \`mask\` is optional. Transparent (alpha=0) pixels = areas to regenerate; opaque pixels are preserved. Mask must match the source's dimensions.
- Without a mask, the whole image can change — use a mask for targeted edits.

### createVariation
DALL-E 2 only. No prompt — the model just riffs on the input image's composition and style. Source must be a square PNG ≤4 MB.

### gpt-image-1 extras
\`background: "transparent"\` produces PNGs with alpha (use \`output_format: "png"\`). \`output_format\` (\`png\`/\`jpeg\`/\`webp\`) + \`output_compression\` (0–100) only apply to this model.

### Tips
- Prompts for generation describe the **desired image** directly ("a vintage travel poster of Mars, art-deco style"). For edits, describe the **desired result after the edit**, not the instruction ("a red door" rather than "paint the door red").
- If content is refused, the API returns a moderation error; surface it to the user rather than retrying with the same prompt.
`,
	apiSetup: {
		baseUrl: 'https://api.openai.com/v1',
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'bearer',
			headers: {
				Authorization: 'Bearer {{ config.apiKey }}',
			},
		},
	],
	scopes: {
		generate: 'Generate images from text prompts using DALL-E or GPT-Image models',
		edit: 'Edit and create variations of existing images',
	},
	tools: [
		// ── Generate Image ────────────────────────────────────────────────────────

		{
			handle: 'generateImage',
			description: 'Generate one or more images from a text prompt using DALL-E 2, DALL-E 3, or GPT-Image-1. Returns image URLs or base64-encoded image data.',
			scopes: ['generate'],
			method: 'POST',
			endpoint: '/images/generations',
			headers: {
				Authorization: 'Bearer {{ config.apiKey }}',
			},
			body: {
				model: '{{ input.model }}',
				prompt: '{{ input.prompt }}',
				n: '{{ input.n }}',
				size: '{{ input.size }}',
				quality: '{{ input.quality }}',
				response_format: '{{ input.response_format }}',
				style: '{{ input.style }}',
				user: '{{ input.user }}',
				background: '{{ input.background }}',
				output_format: '{{ input.output_format }}',
				output_compression: '{{ input.output_compression }}',
				moderation: '{{ input.moderation }}',
			},
			inputSchema: z.object({
				prompt: z.string().describe('A text description of the desired image(s). Maximum length depends on the model.'),
				model: z.enum(['dall-e-3', 'dall-e-2', 'gpt-image-1']).optional().describe('The model to use for image generation. Defaults to dall-e-2.'),
				n: z.number().int().min(1).max(10).optional().describe('The number of images to generate. Must be between 1 and 10. For dall-e-3, only 1 is supported.'),
				size: z.enum(['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792', 'auto']).optional().describe('The size of the generated image. Defaults vary by model.'),
				quality: z.enum(['standard', 'hd', 'low', 'medium', 'high']).optional().describe('The quality of the image. "hd" creates finer details (dall-e-3 only). "low", "medium", "high" apply to gpt-image-1.'),
				response_format: z.enum(['url', 'b64_json']).optional().describe('The format in which the generated images are returned. Defaults to "url".'),
				style: z.enum(['vivid', 'natural']).optional().describe('The style of the generated image (dall-e-3 only). "vivid" produces hyper-real images; "natural" produces more natural-looking images.'),
				user: z.string().optional().describe('A unique identifier representing the end-user, used for abuse monitoring.'),
				background: z.enum(['transparent', 'opaque', 'auto']).optional().describe('Background transparency for the generated image (gpt-image-1 only).'),
				output_format: z.enum(['png', 'jpeg', 'webp']).optional().describe('The output format of the generated image (gpt-image-1 only).'),
				output_compression: z.number().int().min(0).max(100).optional().describe('Compression level for the output image between 0 and 100 (gpt-image-1 only).'),
				moderation: z.string().optional().describe('Moderation level to apply to the prompt and generated image (gpt-image-1 only).'),
			}),
		},

		// ── Edit Image ────────────────────────────────────────────────────────────

		{
			handle: 'editImage',
			description: 'Edit an existing image or create a new image based on a text prompt. Supports inpainting via an optional mask. Accepts an image URL or base64-encoded image data.',
			scopes: ['edit'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const apiKey = context.config?.apiKey as string;

				if (!apiKey) {
					throw new Error('Missing apiKey in integration config');
				}

				// Resolve image bytes
				let imageBytes: Uint8Array;
				let imageMimeType = 'image/png';

				if (input.imageUrl) {
					const imageResponse = await fetch(input.imageUrl as string);
					if (!imageResponse.ok) {
						throw new Error(`Failed to download image from URL: ${imageResponse.statusText}`);
					}
					const contentType = imageResponse.headers.get('content-type');
					if (contentType) {
						imageMimeType = contentType.split(';')[0].trim();
					}
					imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
				} else if (input.imageBase64) {
					const base64 = input.imageBase64 as string;
					const binaryString = atob(base64);
					imageBytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						imageBytes[i] = binaryString.charCodeAt(i);
					}
				} else {
					throw new Error('Either imageUrl or imageBase64 must be provided');
				}

				const imageBlob = new Blob([imageBytes], { type: imageMimeType });

				const form = new FormData();
				form.append('image', imageBlob, 'image.png');
				form.append('prompt', input.prompt as string);

				if (input.model) {
					form.append('model', input.model as string);
				}

				// Resolve optional mask bytes
				if (input.maskUrl || input.maskBase64) {
					let maskBytes: Uint8Array;
					let maskMimeType = 'image/png';

					if (input.maskUrl) {
						const maskResponse = await fetch(input.maskUrl as string);
						if (!maskResponse.ok) {
							throw new Error(`Failed to download mask from URL: ${maskResponse.statusText}`);
						}
						const contentType = maskResponse.headers.get('content-type');
						if (contentType) {
							maskMimeType = contentType.split(';')[0].trim();
						}
						maskBytes = new Uint8Array(await maskResponse.arrayBuffer());
					} else {
						const base64 = input.maskBase64 as string;
						const binaryString = atob(base64);
						maskBytes = new Uint8Array(binaryString.length);
						for (let i = 0; i < binaryString.length; i++) {
							maskBytes[i] = binaryString.charCodeAt(i);
						}
					}

					const maskBlob = new Blob([maskBytes], { type: maskMimeType });
					form.append('mask', maskBlob, 'mask.png');
				}

				if (input.n !== undefined) {
					form.append('n', String(input.n));
				}
				if (input.size) {
					form.append('size', input.size as string);
				}
				if (input.response_format) {
					form.append('response_format', input.response_format as string);
				}

				const response = await fetch('https://api.openai.com/v1/images/edits', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					body: form,
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`OpenAI image edit failed: ${error}`);
				}

				return response.json();
			},
			inputSchema: z.object({
				prompt: z.string().describe('A text description of how to edit the image or the desired resulting image.'),
				imageUrl: z.string().url().optional().describe('URL of the image to edit. The image will be downloaded and uploaded to the API. Must be a PNG with less than 4 MB.'),
				imageBase64: z.string().optional().describe('Base64-encoded image data to edit. Must be a PNG with less than 4 MB.'),
				maskUrl: z.string().url().optional().describe('URL of a mask image. Transparent areas indicate where the image should be edited. Must be a PNG matching the source image dimensions.'),
				maskBase64: z.string().optional().describe('Base64-encoded mask image. Transparent areas indicate where the image should be edited.'),
				model: z.enum(['gpt-image-1', 'dall-e-2']).optional().describe('The model to use for image editing. Defaults to dall-e-2.'),
				n: z.number().int().min(1).max(10).optional().describe('The number of images to generate. Must be between 1 and 10.'),
				size: z.string().optional().describe('The size of the generated images (e.g. "256x256", "512x512", "1024x1024").'),
				response_format: z.string().optional().describe('The format in which generated images are returned: "url" or "b64_json".'),
			}),
		},

		// ── Create Variation ──────────────────────────────────────────────────────

		{
			handle: 'createVariation',
			description: 'Generate one or more variations of a given image using DALL-E 2. Accepts an image URL or base64-encoded image data.',
			scopes: ['edit'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const apiKey = context.config?.apiKey as string;

				if (!apiKey) {
					throw new Error('Missing apiKey in integration config');
				}

				// Resolve image bytes
				let imageBytes: Uint8Array;
				let imageMimeType = 'image/png';

				if (input.imageUrl) {
					const imageResponse = await fetch(input.imageUrl as string);
					if (!imageResponse.ok) {
						throw new Error(`Failed to download image from URL: ${imageResponse.statusText}`);
					}
					const contentType = imageResponse.headers.get('content-type');
					if (contentType) {
						imageMimeType = contentType.split(';')[0].trim();
					}
					imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
				} else if (input.imageBase64) {
					const base64 = input.imageBase64 as string;
					const binaryString = atob(base64);
					imageBytes = new Uint8Array(binaryString.length);
					for (let i = 0; i < binaryString.length; i++) {
						imageBytes[i] = binaryString.charCodeAt(i);
					}
				} else {
					throw new Error('Either imageUrl or imageBase64 must be provided');
				}

				const imageBlob = new Blob([imageBytes], { type: imageMimeType });

				const form = new FormData();
				form.append('image', imageBlob, 'image.png');

				if (input.model) {
					form.append('model', input.model as string);
				}
				if (input.n !== undefined) {
					form.append('n', String(input.n));
				}
				if (input.size) {
					form.append('size', input.size as string);
				}
				if (input.response_format) {
					form.append('response_format', input.response_format as string);
				}

				const response = await fetch('https://api.openai.com/v1/images/variations', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					body: form,
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`OpenAI image variation failed: ${error}`);
				}

				return response.json();
			},
			inputSchema: z.object({
				imageUrl: z.string().url().optional().describe('URL of the source image to create variations of. The image will be downloaded and uploaded to the API. Must be a square PNG with less than 4 MB.'),
				imageBase64: z.string().optional().describe('Base64-encoded source image to create variations of. Must be a square PNG with less than 4 MB.'),
				model: z.enum(['dall-e-2']).optional().describe('The model to use for image variation. Currently only dall-e-2 is supported.'),
				n: z.number().int().min(1).max(10).optional().describe('The number of image variations to generate. Must be between 1 and 10.'),
				size: z.string().optional().describe('The size of the generated images (e.g. "256x256", "512x512", "1024x1024").'),
				response_format: z.string().optional().describe('The format in which generated images are returned: "url" or "b64_json".'),
			}),
		},
	],
};
