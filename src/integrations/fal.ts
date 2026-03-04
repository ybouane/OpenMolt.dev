/**
 * @module integrations/fal
 * fal.ai SDK integration definition.
 * All tools use execute functions backed by the @fal-ai/client SDK.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

// ─── Helper: configure and return the fal client ─────────────────────────────

async function getFalClient(context: ToolContext) {
	const { fal } = await import('@fal-ai/client');
	fal.config({
		credentials: (context.config?.apiKey as string | undefined) || process.env.OPENMOLT_FAL_API_KEY || '',
	});
	return fal;
}

// ─── Integration definition ───────────────────────────────────────────────────

export const falDefinition: IntegrationDefinition = {
	name: 'fal.ai',
	credentialSetup: [
		{
			type: 'bearer',
			headers: {
				Authorization: 'Key {{ config.apiKey }}',
			},
		},
	],
	scopes: {
		generate: 'Generate images and videos using fal.ai models',
		run: 'Run any fal.ai model with arbitrary input',
		storage: 'Upload files to fal.ai CDN storage',
	},
	tools: [
		// ── Image generation ─────────────────────────────────────────────────────

		{
			handle: 'generateImage',
			description: 'Generate one or more images using a fal.ai model (e.g. fal-ai/flux/schnell, fal-ai/flux/dev, fal-ai/stable-diffusion-v3-medium). Returns an array of image objects with URLs.',
			scopes: ['generate'],
			inputSchema: z.object({
				model: z.string().describe('fal.ai model ID, e.g. "fal-ai/flux/schnell" or "fal-ai/flux/dev"'),
				prompt: z.string().describe('Text description of the image to generate'),
				image_size: z.string().optional().describe('Output image size, e.g. "square_hd", "landscape_4_3", "portrait_16_9", or "1024x1024"'),
				num_images: z.number().int().min(1).max(8).optional().describe('Number of images to generate (default 1)'),
				seed: z.number().int().optional().describe('Random seed for reproducibility'),
				enable_safety_checker: z.boolean().optional().describe('Whether to run safety checks on the output (default true)'),
				guidance_scale: z.number().optional().describe('Classifier-free guidance scale (higher = more prompt adherence)'),
				num_inference_steps: z.number().int().optional().describe('Number of diffusion steps (higher = better quality, slower)'),
			}),
			outputSchema: z.object({
				images: z.array(z.object({
					url: z.string().describe('CDN URL of the generated image'),
					width: z.number().describe('Image width in pixels'),
					height: z.number().describe('Image height in pixels'),
					content_type: z.string().optional(),
				})),
				seed: z.number().optional(),
				has_nsfw_concepts: z.array(z.boolean()).optional(),
			}),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const fal = await getFalClient(context);
				const { model, ...modelInput } = input;
				const result = await fal.subscribe(model as string, {
					input: modelInput as Record<string, unknown>,
				});
				return result.data;
			},
		},

		// ── Video generation ─────────────────────────────────────────────────────

		{
			handle: 'generateVideo',
			description: 'Generate a video using a fal.ai model (e.g. fal-ai/kling-video/v1.6/standard/text-to-video, fal-ai/runway-gen3/turbo/text-to-video). Returns a video object with URL.',
			scopes: ['generate'],
			inputSchema: z.object({
				model: z.string().describe('fal.ai model ID for video generation, e.g. "fal-ai/kling-video/v1.6/standard/text-to-video"'),
				prompt: z.string().describe('Text description of the video to generate'),
				duration: z.number().optional().describe('Desired video duration in seconds (model-dependent)'),
				aspect_ratio: z.string().optional().describe('Video aspect ratio, e.g. "16:9", "9:16", "1:1"'),
				seed: z.number().int().optional().describe('Random seed for reproducibility'),
				image_url: z.string().url().optional().describe('Starting frame image URL for image-to-video models'),
				negative_prompt: z.string().optional().describe('Text describing what to avoid in the video'),
			}),
			outputSchema: z.object({
				video: z.object({
					url: z.string().describe('CDN URL of the generated video'),
					content_type: z.string().optional(),
					file_name: z.string().optional(),
					file_size: z.number().optional(),
				}),
				seed: z.number().optional(),
			}),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const fal = await getFalClient(context);
				const { model, ...modelInput } = input;
				const result = await fal.subscribe(model as string, {
					input: modelInput as Record<string, unknown>,
				});
				return result.data;
			},
		},

		// ── Generic model runner ─────────────────────────────────────────────────

		{
			handle: 'runModel',
			description: 'Run any fal.ai model with an arbitrary input object. Use this for models not covered by the specialised tools, or when you need full control over the input parameters.',
			scopes: ['run'],
			inputSchema: z.object({
				model: z.string().describe('fal.ai model ID (e.g. "fal-ai/face-swap", "fal-ai/imageutils/rembg")'),
				input: z.record(z.unknown()).describe('Input object passed directly to the model. Refer to the model\'s documentation for required fields.'),
				timeout: z.number().optional().describe('Request timeout in milliseconds (default: no timeout)'),
			}),
			outputSchema: z.record(z.unknown()).describe('Raw model output — structure depends on the model'),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const fal = await getFalClient(context);
				const result = await fal.subscribe(input.model as string, {
					input: (input.input as Record<string, unknown>) ?? {},
				});
				return result.data;
			},
		},

		// ── Queue status ─────────────────────────────────────────────────────────

		{
			handle: 'getQueueStatus',
			description: 'Check the status of a queued fal.ai request. Use this to poll long-running model jobs submitted via the queue API.',
			scopes: ['run'],
			inputSchema: z.object({
				model: z.string().describe('fal.ai model ID that owns the queued request'),
				requestId: z.string().describe('The request ID returned when the job was enqueued'),
			}),
			outputSchema: z.object({
				status: z.string().describe('Current status: "IN_QUEUE", "IN_PROGRESS", "COMPLETED", or "FAILED"'),
				queue_position: z.number().optional().describe('Position in the queue (when status is IN_QUEUE)'),
				response_url: z.string().optional().describe('URL to fetch the result from (when status is COMPLETED)'),
				logs: z.array(z.record(z.unknown())).optional(),
			}),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const fal = await getFalClient(context);
				const status = await fal.queue.status(input.model as string, {
					requestId: input.requestId as string,
					logs: true,
				});
				return status;
			},
		},

		// ── File upload ──────────────────────────────────────────────────────────

		{
			handle: 'uploadFile',
			description: 'Upload a file to fal.ai CDN storage by providing a publicly accessible URL. The file is re-hosted on fal storage and the new CDN URL is returned. Useful for providing image/video inputs to models that require fal-hosted URLs.',
			scopes: ['storage'],
			inputSchema: z.object({
				url: z.string().url().describe('Publicly accessible URL of the file to upload to fal CDN (HTTP/HTTPS URL or data URL)'),
			}),
			outputSchema: z.object({
				url: z.string().describe('The new fal CDN URL of the uploaded file'),
			}),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const fal = await getFalClient(context);
				const fileUrl = input.url as string;

				// For data URLs, fetch and convert to a Blob before uploading
				if (fileUrl.startsWith('data:')) {
					const response = await fetch(fileUrl);
					const blob = await response.blob();
					const uploadedUrl = await fal.storage.upload(blob);
					return { url: uploadedUrl };
				}

				// For regular URLs, fetch the file then upload the blob
				const response = await fetch(fileUrl);
				if (!response.ok) {
					throw new Error(`Failed to fetch file from URL: ${response.status} ${response.statusText}`);
				}
				const blob = await response.blob();
				const uploadedUrl = await fal.storage.upload(blob);
				return { url: uploadedUrl };
			},
		},
	],
};
