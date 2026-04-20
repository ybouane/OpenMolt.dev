/**
 * @module integrations/httpRequest
 * A generic HTTP request integration that allows agents to make arbitrary
 * HTTP calls to any API not covered by built-in integrations.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const httpRequestDefinition: IntegrationDefinition = {
	name: 'HTTP Request',
	instructions: `
### When to use
A **fallback** for APIs without a dedicated integration. If a dedicated integration (Gmail, Slack, GitHub, etc.) exists for the service, use it instead — it handles auth, templating, and response shaping for you.

### URL & query params
Pass the **full URL** including scheme (\`https://...\`). Query params can be embedded directly in \`url\` or passed as \`queryParams\` (which are URL-encoded for you). When in doubt, prefer \`queryParams\` — it avoids encoding bugs.

### Body serialisation
- Object → auto-JSON-encoded with \`Content-Type: application/json\` (unless you override the header).
- String → sent verbatim with \`Content-Type: text/plain\` (again, override header to change).
- Body is **only** sent for non-GET/HEAD methods.
- For \`application/x-www-form-urlencoded\`, serialise the body yourself into \`"a=1&b=2"\` and set the \`Content-Type\` header explicitly.
- For \`multipart/form-data\`, this tool does not construct multipart bodies — use a dedicated integration or surface to the user.

### Auth
No credentials are attached automatically. Put any API keys / bearer tokens in \`headers\` yourself, e.g. \`{ "Authorization": "Bearer xyz" }\`. Never put secrets in \`url\` or \`queryParams\` (they'd be logged).

### Response
- \`status\` is the numeric HTTP code; \`ok\` is \`true\` when \`200 ≤ status < 300\`. **Non-2xx responses do not throw** — check \`ok\` and \`body\` yourself.
- \`body\` is parsed as JSON when the response's \`Content-Type\` is JSON; otherwise it's a string. Override with \`responseType: "text"\` to force raw text (useful for HTML scraping).

### Timeouts & redirects
Default timeout is 30s; bump via \`timeout\` (ms) for slow endpoints. Set \`followRedirects: false\` if you need to inspect 3xx responses (e.g. OAuth redirects).

### Example — GET with bearer auth
\`\`\`json
{
  "url": "https://api.example.com/v1/items",
  "method": "GET",
  "headers": { "Authorization": "Bearer sk-..." },
  "queryParams": { "limit": "50" }
}
\`\`\`
`,
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
