/**
 * @module integrations/googleAds
 * Google Ads API v18 integration definition.
 *
 * All requests require:
 *   - Authorization: Bearer <access_token>  (OAuth2)
 *   - developer-token: <developer_token>
 *   - Optionally: login-customer-id: <manager_customer_id>
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const googleAdsDefinition: IntegrationDefinition = {
	name: 'Google Ads',
	instructions: `
### Customer IDs
- \`customerId\` is the 10-digit account ID **without hyphens** (e.g. \`1234567890\`, not \`123-456-7890\`).
- If you don't know it, call \`listAccessibleCustomers\` first — it returns \`resourceNames\` like \`"customers/1234567890"\`. Strip the prefix.
- For requests against a client account under a manager (MCC), the \`login-customer-id\` header (set via credential config) must be the manager's ID; \`customerId\` in the path is the child account.

### GAQL (Google Ads Query Language)
\`search\` and \`searchStream\` run GAQL, which resembles SQL but is strict about resource hierarchy:
\`\`\`
SELECT campaign.id, campaign.name, metrics.clicks, metrics.cost_micros
FROM campaign
WHERE segments.date DURING LAST_7_DAYS
  AND campaign.status = 'ENABLED'
ORDER BY metrics.clicks DESC
LIMIT 50
\`\`\`
- Money metrics (\`metrics.cost_micros\`, bids, budgets) are in **micros** — 1 unit = 1,000,000 micros (so \`5_000_000\` = $5 in USD). Always divide by 1e6 for display.
- Common date helpers: \`DURING LAST_7_DAYS\`, \`DURING THIS_MONTH\`, or explicit \`segments.date BETWEEN '2026-01-01' AND '2026-01-31'\`.
- Prefer \`searchStream\` for reports (no pagination, returns everything) and \`search\` only when you need cursors.

### Mutate operations
All \`mutate*\` endpoints take an array of operation objects. Each operation has exactly one of these keys:
- \`create\`: the full resource to insert.
- \`update\`: partial resource + \`updateMask\` listing fields being changed.
- \`remove\`: the resource name to delete, e.g. \`"customers/1234567890/campaigns/987654"\`.

Example — pause a campaign:
\`\`\`json
{
  "operations": [{
    "update": { "resourceName": "customers/1234567890/campaigns/987", "status": "PAUSED" },
    "updateMask": "status"
  }]
}
\`\`\`

### Typical campaign creation flow
1. \`mutateCampaignBudgets\` with a \`create\` → copy the returned \`resourceName\`.
2. \`mutateCampaigns\` with \`create\`, referencing that budget resource name in \`campaignBudget\`.
3. \`mutateAdGroups\` with \`create\`, referencing the campaign resource name.
4. \`mutateAdGroupAds\` / \`mutateAdGroupCriteria\` to add ads and keywords.

Each step must complete before the next because later operations reference earlier \`resourceName\`s.

### Credentials caveat
Requires \`developerToken\` (one-time approval from Google) **plus** an OAuth2 refresh token. 400 errors saying "developer token is not approved" mean the app has not been granted standard access — surface this to the user, don't retry.
`,
	apiSetup: {
		baseUrl: 'https://googleads.googleapis.com/v18',
		headers: {
			'developer-token': '{{ config.developerToken }}',
			'login-customer-id': '{{ config.managerCustomerId }}',
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'oauth2',
			authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenUrl: 'https://oauth2.googleapis.com/token',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: ['https://www.googleapis.com/auth/adwords'],
		},
	],
	scopes: {
		'campaigns.read': 'Read campaign, ad group, and ad data',
		'campaigns.write': 'Create and modify campaigns, ad groups, and ads',
		reports: 'Run GAQL queries and access performance metrics',
		keywords: 'Read and manage keywords',
	},
	tools: [
		// ── Query ─────────────────────────────────────────────────────────────────

		{
			handle: 'searchStream',
			description: 'Execute a GAQL query using the streaming search endpoint. Returns all results without pagination.',
			scopes: ['reports'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/googleAds:searchStream',
			body: {
				query: '{{ input.query }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID (without hyphens, e.g. "1234567890")'),
				query: z.string().describe('GAQL query string (Google Ads Query Language)'),
			}),
		},

		{
			handle: 'search',
			description: 'Execute a paginated GAQL query against the Google Ads API.',
			scopes: ['reports'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/googleAds:search',
			body: {
				query: '{{ input.query }}',
				pageSize: '{{ input.pageSize }}',
				pageToken: '{{ input.pageToken }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				query: z.string().describe('GAQL query string'),
				pageSize: z.number().int().min(1).max(10000).optional().describe('Number of results per page (max 10000)'),
				pageToken: z.string().optional().describe('Page token from a previous search response'),
			}),
		},

		{
			handle: 'listAccessibleCustomers',
			description: 'List all Google Ads customer IDs accessible to the authenticated user.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/customers:listAccessibleCustomers',
			inputSchema: z.object({}),
		},

		// ── Campaigns ────────────────────────────────────────────────────────────

		{
			handle: 'mutateCampaigns',
			description: 'Create, update, or remove Google Ads campaigns in a single mutate request.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/campaigns:mutate',
			body: {
				operations: '{{ input.operations }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				operations: z.array(z.record(z.unknown())).describe('Array of campaign mutate operations. Each has a "create", "update", or "remove" key with the campaign resource.'),
			}),
		},

		// ── Ad Groups ────────────────────────────────────────────────────────────

		{
			handle: 'mutateAdGroups',
			description: 'Create, update, or remove Google Ads ad groups in a single mutate request.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/adGroups:mutate',
			body: {
				operations: '{{ input.operations }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				operations: z.array(z.record(z.unknown())).describe('Array of ad group mutate operations. Each has a "create", "update", or "remove" key.'),
			}),
		},

		// ── Ads ──────────────────────────────────────────────────────────────────

		{
			handle: 'mutateAdGroupAds',
			description: 'Create, update, or remove Google Ads ads in a single mutate request.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/adGroupAds:mutate',
			body: {
				operations: '{{ input.operations }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				operations: z.array(z.record(z.unknown())).describe('Array of ad mutate operations.'),
			}),
		},

		// ── Keywords ─────────────────────────────────────────────────────────────

		{
			handle: 'mutateAdGroupCriteria',
			description: 'Create, update, or remove keywords and other ad group criteria.',
			scopes: ['keywords'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/adGroupCriteria:mutate',
			body: {
				operations: '{{ input.operations }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				operations: z.array(z.record(z.unknown())).describe('Array of ad group criterion mutate operations (e.g. keyword creates/removes).'),
			}),
		},

		// ── Budgets ──────────────────────────────────────────────────────────────

		{
			handle: 'mutateCampaignBudgets',
			description: 'Create, update, or remove Google Ads campaign budgets.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/customers/{{ input.customerId }}/campaignBudgets:mutate',
			body: {
				operations: '{{ input.operations }}',
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				operations: z.array(z.record(z.unknown())).describe('Array of campaign budget mutate operations.'),
			}),
		},
	],
};
