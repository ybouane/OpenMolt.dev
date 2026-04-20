import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const geminiMediaModelsDefinition: IntegrationDefinition = {
	name: 'Gemini Media Models',
	instructions: `
### Image in, image out: everything is base64
Every \`base64\` field (\`baseImageBase64\`, \`maskBase64\`, \`imageBase64\`, generated \`base64Data\`) is the **raw base64 string only** — no \`data:\` prefix, no surrounding quotes. If you receive an image from another tool as a URL or data URI, fetch/decode it to pure base64 first.

### generateImage (Imagen 3)
Returns \`images: [{ base64Data, mimeType }]\`. \`aspectRatio\` must be one of \`1:1\`, \`9:16\`, \`16:9\`, \`3:4\`, \`4:3\` — other ratios are rejected. Up to 4 images per call. Use \`negativePrompt\` for things you want to **avoid**, not for quality modifiers.

### editImage (Imagen 3 capability)
- \`baseImageBase64\` is required; the edit is applied to that image.
- \`maskBase64\` is optional. When provided, **white pixels = areas to edit, black pixels = areas to preserve**. Mask must be the same dimensions as the base image.
- The prompt describes the **target result**, not the diff (e.g. "a red door" rather than "change the door to red").

### generateVideo (Veo 3) is long-running
\`generateVideo\` starts an async operation and usually returns \`{ operationName, done: false }\`. Workflow:
1. Call \`generateVideo\`.
2. If \`done: true\`, read \`videoUri\`. Otherwise keep \`operationName\`.
3. \`wait\` 20–30 seconds.
4. Call \`pollVideoOperation\` with the \`operationName\`. Repeat step 3–4 until \`done: true\`. A single generation can take **1–5 minutes** — do not poll in a tight loop.

Duration is clamped to 5–8 seconds. Aspect ratio for video is only \`16:9\` or \`9:16\`.

The returned \`videoUri\` points to Google's CDN; persist it elsewhere if you need it longer than ~an hour.

### generateContent (text / multimodal)
- Default model is \`gemini-2.0-flash\` (fast, cheap). Use \`gemini-1.5-pro\` / \`gemini-2.5-pro\` when the task needs heavier reasoning.
- For vision, pass \`imageBase64\` **and** \`imageMimeType\` together — one without the other is silently ignored.
- \`temperature\` range is 0–2 (not 0–1). Default ~1. Use \`0\` for deterministic extractive tasks.
`,
	credentialSetup: [
		{
			type: 'custom',
			queryParams: {
				key: '{{ config.apiKey }}',
			},
		},
	],
	scopes: {
		generate: 'Generate text and multimodal content using Gemini models',
		media: 'Generate and edit images and videos using Imagen and Veo',
	},
	tools: [
		{
			handle: 'generateImage',
			description: 'Generate images using Imagen 3 via the Gemini API',
			scopes: ['media'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const apiKey = config?.apiKey as string;

				const instances: Array<{ prompt: string }> = [{ prompt: input.prompt as string }];
				const parameters: Record<string, unknown> = {
					sampleCount: (input.numberOfImages as number) ?? 1,
				};

				if (input.aspectRatio) {
					parameters.aspectRatio = input.aspectRatio;
				}

				if (input.negativePrompt) {
					parameters.negativePrompt = input.negativePrompt;
				}

				if (input.language) {
					parameters.language = input.language;
				}

				const response = await fetch(
					`${GEMINI_BASE_URL}/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ instances, parameters }),
					},
				);

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to generate image: ${error}`);
				}

				const result = await response.json() as {
					predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
				};

				const images = (result.predictions ?? []).map((p) => ({
					base64Data: p.bytesBase64Encoded ?? '',
					mimeType: p.mimeType ?? 'image/png',
				}));

				return { images };
			},
			inputSchema: z.object({
				prompt: z.string().describe('Text prompt describing the image to generate'),
				numberOfImages: z.number().int().min(1).max(4).optional().default(1).describe('Number of images to generate (1-4)'),
				aspectRatio: z.enum(['1:1', '9:16', '16:9', '3:4', '4:3']).optional().describe('Aspect ratio of the generated images'),
				negativePrompt: z.string().optional().describe('Text describing what to avoid in the generated images'),
				language: z.string().optional().describe('Language code for the prompt (e.g. en, es, fr)'),
			}),
			outputSchema: z.object({
				images: z.array(z.object({
					base64Data: z.string().describe('Base64-encoded image data'),
					mimeType: z.string().describe('MIME type of the image (e.g. image/png, image/jpeg)'),
				})),
			}),
		},
		{
			handle: 'editImage',
			description: 'Edit an existing image using Imagen with a text prompt and optional mask',
			scopes: ['media'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const apiKey = config?.apiKey as string;

				const instance: Record<string, unknown> = {
					prompt: input.prompt as string,
					image: {
						bytesBase64Encoded: input.baseImageBase64 as string,
					},
				};

				if (input.maskBase64) {
					instance.mask = {
						image: { bytesBase64Encoded: input.maskBase64 },
					};
				}

				const parameters: Record<string, unknown> = {
					sampleCount: (input.numberOfImages as number) ?? 1,
				};

				const response = await fetch(
					`${GEMINI_BASE_URL}/models/imagen-3.0-capability-004:predict?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ instances: [instance], parameters }),
					},
				);

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to edit image: ${error}`);
				}

				const result = await response.json() as {
					predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
				};

				const images = (result.predictions ?? []).map((p) => ({
					base64Data: p.bytesBase64Encoded ?? '',
					mimeType: p.mimeType ?? 'image/png',
				}));

				return { images };
			},
			inputSchema: z.object({
				prompt: z.string().describe('Text prompt describing the desired edits'),
				baseImageBase64: z.string().describe('Base64-encoded source image to edit'),
				maskBase64: z.string().optional().describe('Base64-encoded mask image indicating areas to edit (white = edit, black = preserve)'),
				numberOfImages: z.number().int().min(1).max(4).optional().default(1).describe('Number of edited images to generate'),
			}),
			outputSchema: z.object({
				images: z.array(z.object({
					base64Data: z.string().describe('Base64-encoded edited image data'),
					mimeType: z.string().describe('MIME type of the image'),
				})),
			}),
		},
		{
			handle: 'generateVideo',
			description: 'Generate a video using Veo 3 via a long-running operation. Returns an operation name that can be polled with pollVideoOperation.',
			scopes: ['media'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const apiKey = config?.apiKey as string;

				const parameters: Record<string, unknown> = {
					durationSeconds: (input.durationSeconds as number) ?? 8,
				};

				if (input.aspectRatio) {
					parameters.aspectRatio = input.aspectRatio;
				}

				if (input.negativePrompt) {
					parameters.negativePrompt = input.negativePrompt;
				}

				const response = await fetch(
					`${GEMINI_BASE_URL}/models/veo-3.0-generate-preview:predictLongRunning?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							instances: [{ prompt: input.prompt as string }],
							parameters,
						}),
					},
				);

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to start video generation: ${error}`);
				}

				const operation = await response.json() as {
					name?: string;
					done?: boolean;
					response?: { videos?: Array<{ uri?: string; mimeType?: string }> };
					error?: { message?: string };
				};

				if (operation.done && operation.response?.videos?.[0]) {
					const video = operation.response.videos[0];
					return {
						operationName: operation.name,
						done: true,
						videoUri: video.uri,
						mimeType: video.mimeType ?? 'video/mp4',
					};
				}

				return {
					operationName: operation.name,
					done: false,
				};
			},
			inputSchema: z.object({
				prompt: z.string().describe('Text prompt describing the video to generate'),
				aspectRatio: z.enum(['16:9', '9:16']).optional().describe('Aspect ratio of the generated video'),
				durationSeconds: z.number().int().min(5).max(8).optional().default(8).describe('Duration of the video in seconds (5-8)'),
				negativePrompt: z.string().optional().describe('Text describing what to avoid in the generated video'),
			}),
			outputSchema: z.object({
				operationName: z.string().optional().describe('Name of the long-running operation to poll'),
				done: z.boolean().describe('Whether the operation completed immediately'),
				videoUri: z.string().optional().describe('URI of the generated video (only present if done=true)'),
				mimeType: z.string().optional().describe('MIME type of the video'),
			}),
		},
		{
			handle: 'pollVideoOperation',
			description: 'Poll the status of a long-running video generation operation started by generateVideo',
			scopes: ['media'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const apiKey = config?.apiKey as string;
				const operationName = input.operationName as string;

				// The operationName may be a full path like "operations/abc123" or include the base URL
				const url = operationName.startsWith('http')
					? `${operationName}?key=${apiKey}`
					: `${GEMINI_BASE_URL}/${operationName}?key=${apiKey}`;

				const response = await fetch(url, {
					headers: { 'Content-Type': 'application/json' },
				});

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to poll video operation: ${error}`);
				}

				const operation = await response.json() as {
					name?: string;
					done?: boolean;
					response?: { videos?: Array<{ uri?: string; mimeType?: string }> };
					error?: { message?: string; code?: number };
				};

				if (operation.error) {
					return {
						done: true,
						error: operation.error.message ?? 'Unknown error during video generation',
					};
				}

				if (operation.done && operation.response?.videos?.[0]) {
					const video = operation.response.videos[0];
					return {
						done: true,
						videoUri: video.uri,
						mimeType: video.mimeType ?? 'video/mp4',
					};
				}

				return { done: false };
			},
			inputSchema: z.object({
				operationName: z.string().describe('The operation name returned by generateVideo'),
			}),
			outputSchema: z.object({
				done: z.boolean().describe('Whether the video generation operation has completed'),
				videoUri: z.string().optional().describe('URI of the generated video (present when done=true and no error)'),
				mimeType: z.string().optional().describe('MIME type of the generated video'),
				error: z.string().optional().describe('Error message if video generation failed'),
			}),
		},
		{
			handle: 'generateContent',
			description: 'Generate text or multimodal content using a Gemini model',
			scopes: ['generate'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const apiKey = config?.apiKey as string;
				const model = (input.model as string) ?? 'gemini-2.0-flash';

				const parts: Array<Record<string, unknown>> = [];

				if (input.imageBase64 && input.imageMimeType) {
					parts.push({
						inlineData: {
							mimeType: input.imageMimeType,
							data: input.imageBase64,
						},
					});
				}

				parts.push({ text: input.prompt as string });

				const requestBody: Record<string, unknown> = {
					contents: [{ parts }],
				};

				const generationConfig: Record<string, unknown> = {};
				if (input.temperature !== undefined) {
					generationConfig.temperature = input.temperature;
				}

				if (input.maxOutputTokens !== undefined) {
					generationConfig.maxOutputTokens = input.maxOutputTokens;
				}

				if (Object.keys(generationConfig).length > 0) {
					requestBody.generationConfig = generationConfig;
				}

				const response = await fetch(
					`${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`,
					{
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(requestBody),
					},
				);

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to generate content: ${error}`);
				}

				const result = await response.json() as {
					candidates?: Array<{
						content?: {
							parts?: Array<{ text?: string }>;
						};
					}>;
					usageMetadata?: {
						promptTokenCount?: number;
						candidatesTokenCount?: number;
						totalTokenCount?: number;
					};
				};

				const text = result.candidates?.[0]?.content?.parts
					?.map((p) => p.text ?? '')
					.join('') ?? '';

				return {
					text,
					usage: result.usageMetadata
						? {
							promptTokens: result.usageMetadata.promptTokenCount,
							completionTokens: result.usageMetadata.candidatesTokenCount,
							totalTokens: result.usageMetadata.totalTokenCount,
						}
						: undefined,
				};
			},
			inputSchema: z.object({
				model: z.string().optional().default('gemini-2.0-flash').describe('The Gemini model to use (e.g. gemini-2.0-flash, gemini-1.5-pro)'),
				prompt: z.string().describe('The text prompt to send to the model'),
				imageBase64: z.string().optional().describe('Base64-encoded image data to include in the prompt'),
				imageMimeType: z.string().optional().describe('MIME type of the image (e.g. image/jpeg, image/png) — required when imageBase64 is provided'),
				temperature: z.number().min(0).max(2).optional().describe('Sampling temperature (0-2); lower values are more deterministic'),
				maxOutputTokens: z.number().int().min(1).optional().describe('Maximum number of tokens to generate'),
			}),
			outputSchema: z.object({
				text: z.string().describe('The generated text response from the model'),
				usage: z.object({
					promptTokens: z.number().optional(),
					completionTokens: z.number().optional(),
					totalTokens: z.number().optional(),
				}).optional().describe('Token usage statistics'),
			}),
		},
	],
};
