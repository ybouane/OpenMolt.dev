/**
 * @module integrations/browserUse
 * browser-use.com Cloud API integration definition.
 * Provides programmatic web browsing capabilities for agents.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const browserUseDefinition: IntegrationDefinition = {
	name: 'Browser Use',
	apiSetup: {
		baseUrl: 'https://api.browser-use.com/api/v1',
		headers: {
			'Content-Type': 'application/json',
			Authorization: 'Bearer {{ config.apiKey }}',
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
		tasks: 'Create, run, and manage browser tasks.',
	},
	tools: [
		{
			handle: 'createTask',
			description:
				'Create and start a new browser automation task. The agent navigates the web autonomously to complete the task description. Returns a taskId to track progress.',
			scopes: ['tasks'],
			method: 'POST',
			endpoint: '/run-task',
			body: {
				task: '{{ input.task }}',
				start_url: '{{ input.startUrl }}',
				llm: '{{ input.llm }}',
				browser_config: '{{ input.browserConfig }}',
				use_adblock: '{{ input.useAdblock }}',
				use_proxy: '{{ input.useProxy }}',
				proxy_country_code: '{{ input.proxyCountryCode }}',
				save_video: '{{ input.saveVideo }}',
				save_browser_data: '{{ input.saveBrowserData }}',
			},
			inputSchema: z.object({
				task: z.string().describe('Natural language description of the task for the browser agent to complete'),
				startUrl: z.string().optional().describe('URL to navigate to before starting the task'),
				llm: z.record(z.unknown()).optional().describe('LLM configuration override for the browser agent'),
				browserConfig: z.record(z.unknown()).optional().describe('Browser configuration options'),
				useAdblock: z.boolean().optional().describe('Enable ad blocking'),
				useProxy: z.boolean().optional().describe('Use a proxy for requests'),
				proxyCountryCode: z.string().optional().describe('2-letter country code for proxy location'),
				saveVideo: z.boolean().optional().describe('Save a video recording of the browser session'),
				saveBrowserData: z.boolean().optional().describe('Save browser session data (cookies, local storage)'),
			}),
			outputSchema: z.object({
				taskId: z.string().describe('ID to use for polling task status'),
			}),
		},
		{
			handle: 'getTask',
			description:
				'Get the current status and result of a browser task. Poll this until status is "completed" or "failed".',
			scopes: ['tasks'],
			method: 'GET',
			endpoint: '/task/{{ input.taskId }}',
			inputSchema: z.object({
				taskId: z.string().describe('Task ID returned by createTask'),
			}),
			outputSchema: z.object({
				taskId: z.string(),
				status: z.string().describe('pending, running, paused, completed, failed'),
				output: z.string().optional().describe('Final output from the task when completed'),
				steps: z.array(z.record(z.unknown())).optional().describe('Execution steps taken'),
				recordingUrl: z.string().optional().describe('URL to video recording if saveVideo was enabled'),
				error: z.string().optional(),
			}),
		},
		{
			handle: 'pauseTask',
			description: 'Pause a currently running browser task.',
			scopes: ['tasks'],
			method: 'PUT',
			endpoint: '/pause-task/{{ input.taskId }}',
			inputSchema: z.object({
				taskId: z.string(),
			}),
		},
		{
			handle: 'resumeTask',
			description: 'Resume a paused browser task.',
			scopes: ['tasks'],
			method: 'PUT',
			endpoint: '/resume-task/{{ input.taskId }}',
			inputSchema: z.object({
				taskId: z.string(),
			}),
		},
		{
			handle: 'stopTask',
			description: 'Stop and cancel a running browser task.',
			scopes: ['tasks'],
			method: 'PUT',
			endpoint: '/stop-task/{{ input.taskId }}',
			inputSchema: z.object({
				taskId: z.string(),
			}),
		},
		{
			handle: 'getMedia',
			description: 'Get screenshots and other media files captured during a browser task.',
			scopes: ['tasks'],
			method: 'GET',
			endpoint: '/task/{{ input.taskId }}/media',
			inputSchema: z.object({
				taskId: z.string(),
			}),
			outputSchema: z.object({
				screenshots: z.array(z.object({
					url: z.string(),
					timestamp: z.string().optional(),
					stepIndex: z.number().optional(),
				})).optional(),
				recording: z.object({ url: z.string() }).optional(),
			}),
		},
		{
			handle: 'listTasks',
			description: 'List all browser tasks with optional filtering.',
			scopes: ['tasks'],
			method: 'GET',
			endpoint: '/tasks',
			queryParams: {
				limit: '{{ input.limit }}',
				offset: '{{ input.offset }}',
				status: '{{ input.status }}',
			},
			inputSchema: z.object({
				limit: z.number().optional().describe('Maximum number of tasks to return'),
				offset: z.number().optional().describe('Pagination offset'),
				status: z.string().optional().describe('Filter by status: pending, running, completed, failed'),
			}),
		},
	],
};
