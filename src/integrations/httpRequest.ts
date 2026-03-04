/**
 * @module integrations/httpRequest
 * A generic HTTP request integration that allows agents to make arbitrary
 * HTTP calls to any API not covered by built-in integrations.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const httpRequestDefinition: IntegrationDefinition = {
	name: 'HTTP Request',
	apiSetup: {
		baseUrl: '',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'custom',
			headers: {},
		},
	],
	scopes: {
		request: 'Make arbitrary HTTP requests.',
	},
	tools: [
		{
			handle: 'request',
			description:
				'Make a generic HTTP request to any URL. Useful for APIs not covered by built-in integrations. ' +
				'Supports JSON, form-data, and plain text request bodies. Returns the response status, headers, and body.',
			scopes: ['request'],
			execute: async (input: Record<string, unknown>, _context: ToolContext): Promise<unknown> => {
				const url = input.url as string;
				const method = ((input.method as string) || 'GET').toUpperCase();
				const customHeaders = (input.headers as Record<string, string>) || {};
				const queryParams = (input.queryParams as Record<string, string>) || {};
				const body = input.body;
				const responseType = (input.responseType as string) || 'json';
				const timeout = (input.timeout as number) || 30000;

				// Build URL with query params
				const urlObj = new URL(url);
				for (const [k, v] of Object.entries(queryParams)) {
					if (v !== undefined && v !== null) {
						urlObj.searchParams.set(k, String(v));
					}
				}

				// Build headers
				const headers: Record<string, string> = { ...customHeaders };

				// Build body
				let requestBody: string | undefined;
				if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
					if (typeof body === 'string') {
						requestBody = body;
						headers['Content-Type'] = headers['Content-Type'] || 'text/plain';
					} else {
						requestBody = JSON.stringify(body);
						headers['Content-Type'] = headers['Content-Type'] || 'application/json';
					}
				}

				// Execute with timeout
				const controller = new AbortController();
				const timer = setTimeout(() => controller.abort(), timeout);

				let response: Response;
				try {
					response = await fetch(urlObj.toString(), {
						method,
						headers,
						body: requestBody,
						signal: controller.signal,
						redirect: input.followRedirects === false ? 'manual' : 'follow',
					});
				} finally {
					clearTimeout(timer);
				}

				// Collect response headers
				const responseHeaders: Record<string, string> = {};
				response.headers.forEach((value, key) => {
					responseHeaders[key] = value;
				});

				// Parse response body
				let responseBody: unknown;
				const contentType = response.headers.get('content-type') || '';

				if (responseType === 'text' || !contentType.includes('json')) {
					responseBody = await response.text();
					// Try to parse as JSON anyway if responseType is json
					if (responseType === 'json') {
						try { responseBody = JSON.parse(responseBody as string); } catch { /* keep as text */ }
					}
				} else {
					try {
						responseBody = await response.json();
					} catch {
						responseBody = await response.text();
					}
				}

				return {
					status: response.status,
					statusText: response.statusText,
					ok: response.ok,
					headers: responseHeaders,
					body: responseBody,
				};
			},
			inputSchema: z.object({
				url: z.string().describe('The full URL to make the request to'),
				method: z
					.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
					.optional()
					.describe('HTTP method (default: GET)'),
				headers: z
					.record(z.string())
					.optional()
					.describe('Request headers as key-value pairs'),
				queryParams: z
					.record(z.string())
					.optional()
					.describe('Query string parameters appended to the URL'),
				body: z
					.unknown()
					.optional()
					.describe('Request body. Objects are serialised as JSON; strings sent as-is.'),
				responseType: z
					.enum(['json', 'text'])
					.optional()
					.describe('Expected response format (default: json)'),
				timeout: z
					.number()
					.optional()
					.describe('Request timeout in milliseconds (default: 30000)'),
				followRedirects: z
					.boolean()
					.optional()
					.describe('Whether to follow redirects (default: true)'),
			}),
			outputSchema: z.object({
				status: z.number(),
				statusText: z.string(),
				ok: z.boolean(),
				headers: z.record(z.string()),
				body: z.unknown(),
			}),
		},
	],
};
