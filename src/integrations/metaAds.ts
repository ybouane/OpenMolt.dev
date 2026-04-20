/**
 * @module integrations/metaAds
 * Meta (Facebook) Marketing API v20.0 integration definition.
 * Supports campaign, ad set, ad, and insights management.
 *
 * Note: Meta Graph API requires access_token as a query parameter on all requests.
 * This is passed alongside bearer auth via queryParams templates.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const metaAdsDefinition: IntegrationDefinition = {
	name: 'Meta Ads',
	instructions: `
### Ad account IDs
\`actId\` must be prefixed with \`act_\` (e.g. \`"act_1234567890"\`) in every request. Campaign / ad set / ad / creative IDs are bare numeric strings (no prefix). \`getAdAccounts\` returns the \`id\` already prefixed.

### Hierarchy
**Campaign → Ad Set → Ad → Creative**. You cannot create an ad without an ad set, and an ad set without a campaign. Typical create flow:
1. \`createCampaign\` (choose \`objective\`) → copy \`id\`.
2. \`createAdSet\` under that campaign (choose targeting, budget, optimization goal).
3. \`createAdCreative\` (creative asset + link + copy).
4. \`createAd\` tying an ad set to a creative.

Always start new entities with \`status: "PAUSED"\` unless the user explicitly asked for live activation — pushing \`ACTIVE\` immediately can spend real money on misconfigured campaigns.

### Money is in account-currency minor units
\`dailyBudget\`, \`lifetimeBudget\`, \`spendCap\`, and the results of \`getAdInsights\` are all in **cents / minor units** of the account's currency (e.g. \`dailyBudget: 5000\` = $50 in a USD account). Always confirm currency via \`getAdAccount\`.

### Objectives (current naming)
Newer \`OUTCOME_*\` values replace the legacy list:
- \`OUTCOME_TRAFFIC\`, \`OUTCOME_ENGAGEMENT\`, \`OUTCOME_LEADS\`, \`OUTCOME_SALES\`, \`OUTCOME_APP_PROMOTION\`, \`OUTCOME_AWARENESS\`.

Legacy values (\`LINK_CLICKS\`, \`CONVERSIONS\`, etc.) still work on older accounts but are deprecated.

### Special ad categories
If the campaign pitches \`CREDIT\`, \`EMPLOYMENT\`, \`HOUSING\`, \`ISSUES_ELECTIONS_POLITICS\`, or similar regulated content, \`specialAdCategories\` **must** be set. Targeting options are restricted automatically.

### Targeting spec (ad sets)
Ad set targeting is a nested object, e.g.:
\`\`\`json
{
  "geo_locations": { "countries": ["US"] },
  "age_min": 18,
  "age_max": 44,
  "interests": [{ "id": "6003107902433", "name": "Coffee" }]
}
\`\`\`
Interest/behavior IDs come from Meta's targeting search API — do not invent them.

### Dates
\`start_time\`, \`stop_time\` are ISO 8601 strings. Times are interpreted in the ad account's timezone (\`timezone_name\`). Prefer explicit offsets (\`2026-05-01T09:00:00-07:00\`) to avoid drift.

### Insights queries
\`getAdInsights\` / \`getAdAccountInsights\` take \`fields\` (comma-separated metric names) and either \`date_preset\` (\`last_7d\`, \`last_30d\`, \`this_month\`, …) **or** a \`time_range: { since, until }\`. For breakdowns (by age, placement, country, etc.) pass \`breakdowns\`. Meta caches insight responses — fresh data can lag up to an hour.

### Pagination
All list endpoints paginate with \`after\` cursors, not page numbers. Response has \`paging.cursors.after\`; pass it back as \`after\` to continue.

### Rate limits
Marketing API rate limits are **per-account, per-hour** and scale with ad spend. On 429, back off for several minutes — retrying immediately will extend the lockout.
`,
	apiSetup: {
		baseUrl: 'https://graph.facebook.com/v20.0',
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'custom',
			queryParams: {
				access_token: '{{ config.apiKey }}',
			},
		},
	],
	scopes: {
		'campaigns.read': 'Read campaigns, ad sets, and ads.',
		'campaigns.write': 'Create and update campaigns, ad sets, and ads.',
		insights: 'Access performance metrics and insights.',
		audiences: 'Create and manage custom audiences.',
	},
	tools: [
		{
			handle: 'getAdAccounts',
			description: 'Get all ad accounts accessible by the authenticated user.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/me/adaccounts',
			queryParams: {
				fields: '{{ input.fields }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				fields: z.string().optional().describe('Comma-separated fields to return (default: id,name,currency,account_status,timezone_name,spend_cap,amount_spent)'),
				limit: z.number().optional().describe('Number of results per page'),
				after: z.string().optional().describe('Cursor for pagination'),
			}),
		},

		{
			handle: 'getAdAccount',
			description: 'Get details for a specific ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				actId: z.string().describe('Ad account ID (e.g. act_123456)'),
				fields: z.string().optional().describe('Comma-separated fields to return'),
			}),
		},

		{
			handle: 'listCampaigns',
			description: 'List campaigns for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/campaigns',
			queryParams: {
				fields: '{{ input.fields }}',
				effective_status: '{{ input.status }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				actId: z.string().describe('Ad account ID'),
				fields: z.string().optional().describe('Comma-separated fields to return'),
				status: z.array(z.string()).optional().describe('Filter by status array, e.g. ["ACTIVE","PAUSED"]'),
				limit: z.number().optional(),
				after: z.string().optional(),
			}),
		},

		{
			handle: 'getCampaign',
			description: 'Get details for a specific campaign.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.campaignId }}',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				campaignId: z.string().describe('Campaign ID'),
				fields: z.string().optional().describe('Comma-separated fields to return'),
			}),
		},

		{
			handle: 'createCampaign',
			description: 'Create a new campaign.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.actId }}/campaigns',
			body: {
				name: '{{ input.name }}',
				objective: '{{ input.objective }}',
				status: '{{ input.status }}',
				special_ad_categories: '{{ input.specialAdCategories }}',
				daily_budget: '{{ input.dailyBudget }}',
				lifetime_budget: '{{ input.lifetimeBudget }}',
				spend_cap: '{{ input.spendCap }}',
				start_time: '{{ input.startTime }}',
				stop_time: '{{ input.stopTime }}',
				buying_type: '{{ input.buyingType }}',
			},
			inputSchema: z.object({
				actId: z.string().describe('Ad account ID'),
				name: z.string().describe('Campaign name'),
				objective: z.string().describe('Campaign objective: OUTCOME_TRAFFIC, OUTCOME_LEADS, OUTCOME_SALES, etc.'),
				status: z.enum(['ACTIVE', 'PAUSED']).optional(),
				specialAdCategories: z.array(z.string()).optional().describe('Required for restricted categories: CREDIT, EMPLOYMENT, HOUSING, etc.'),
				dailyBudget: z.number().optional().describe('Daily budget in account currency cents'),
				lifetimeBudget: z.number().optional(),
				spendCap: z.number().optional(),
				startTime: z.string().optional().describe('ISO 8601 start time'),
				stopTime: z.string().optional(),
				buyingType: z.string().optional().describe('AUCTION or RESERVED'),
			}),
		},

		{
			handle: 'updateCampaign',
			description: 'Update an existing campaign.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.campaignId }}',
			body: {
				name: '{{ input.name }}',
				status: '{{ input.status }}',
				daily_budget: '{{ input.dailyBudget }}',
				lifetime_budget: '{{ input.lifetimeBudget }}',
				spend_cap: '{{ input.spendCap }}',
			},
			inputSchema: z.object({
				campaignId: z.string(),
				name: z.string().optional(),
				status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED']).optional(),
				dailyBudget: z.number().optional(),
				lifetimeBudget: z.number().optional(),
				spendCap: z.number().optional(),
			}),
		},

		{
			handle: 'deleteCampaign',
			description: 'Delete a campaign.',
			scopes: ['campaigns.write'],
			method: 'DELETE',
			endpoint: '/{{ input.campaignId }}',
			inputSchema: z.object({ campaignId: z.string() }),
		},

		{
			handle: 'listAdSets',
			description: 'List ad sets for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/adsets',
			queryParams: {
				fields: '{{ input.fields }}',
				effective_status: '{{ input.status }}',
				campaign_id: '{{ input.campaignId }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional(),
				status: z.array(z.string()).optional(),
				campaignId: z.string().optional(),
				limit: z.number().optional(),
				after: z.string().optional(),
			}),
		},

		{
			handle: 'createAdSet',
			description: 'Create a new ad set within a campaign.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.actId }}/adsets',
			body: {
				name: '{{ input.name }}',
				campaign_id: '{{ input.campaignId }}',
				billing_event: '{{ input.billingEvent }}',
				optimization_goal: '{{ input.optimizationGoal }}',
				targeting: '{{ input.targeting }}',
				status: '{{ input.status }}',
				daily_budget: '{{ input.dailyBudget }}',
				lifetime_budget: '{{ input.lifetimeBudget }}',
				start_time: '{{ input.startTime }}',
				end_time: '{{ input.endTime }}',
				bid_amount: '{{ input.bidAmount }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				name: z.string(),
				campaignId: z.string(),
				dailyBudget: z.number().optional(),
				lifetimeBudget: z.number().optional(),
				startTime: z.string().optional(),
				endTime: z.string().optional(),
				billingEvent: z.string().optional().describe('IMPRESSIONS, LINK_CLICKS, etc.'),
				optimizationGoal: z.string().describe('REACH, LINK_CLICKS, CONVERSIONS, etc.'),
				targeting: z.record(z.unknown()).describe('Targeting spec object'),
				status: z.enum(['ACTIVE', 'PAUSED']).optional(),
				bidAmount: z.number().optional().describe('Bid amount in cents'),
			}),
		},

		{
			handle: 'updateAdSet',
			description: 'Update an existing ad set.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.adsetId }}',
			body: {
				name: '{{ input.name }}',
				status: '{{ input.status }}',
				daily_budget: '{{ input.dailyBudget }}',
				targeting: '{{ input.targeting }}',
			},
			inputSchema: z.object({
				adsetId: z.string(),
				name: z.string().optional(),
				status: z.string().optional(),
				dailyBudget: z.number().optional(),
				targeting: z.record(z.unknown()).optional(),
			}),
		},

		{
			handle: 'listAds',
			description: 'List ads for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/ads',
			queryParams: {
				fields: '{{ input.fields }}',
				effective_status: '{{ input.status }}',
				adset_id: '{{ input.adsetId }}',
				campaign_id: '{{ input.campaignId }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional(),
				status: z.array(z.string()).optional(),
				adsetId: z.string().optional(),
				campaignId: z.string().optional(),
				limit: z.number().optional(),
				after: z.string().optional(),
			}),
		},

		{
			handle: 'createAd',
			description: 'Create a new ad.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.actId }}/ads',
			body: {
				name: '{{ input.name }}',
				adset_id: '{{ input.adsetId }}',
				creative: '{{ input.creative }}',
				status: '{{ input.status }}',
				tracking_specs: '{{ input.trackingSpecs }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				name: z.string(),
				adsetId: z.string(),
				creative: z.record(z.unknown()).describe('Creative spec object (creative_id or inline creative)'),
				status: z.enum(['ACTIVE', 'PAUSED']).optional(),
				trackingSpecs: z.array(z.record(z.unknown())).optional(),
			}),
		},

		{
			handle: 'getAdInsights',
			description: 'Get performance insights for a campaign, ad set, or ad.',
			scopes: ['insights'],
			method: 'GET',
			endpoint: '/{{ input.objectId }}/insights',
			queryParams: {
				fields: '{{ input.fields }}',
				level: '{{ input.level }}',
				date_preset: '{{ input.datePreset }}',
				time_range: '{{ input.timeRange }}',
				breakdowns: '{{ input.breakdowns }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				objectId: z.string().describe('Campaign, ad set, or ad ID'),
				fields: z.string().optional().describe('Comma-separated metric fields'),
				level: z.enum(['account', 'campaign', 'adset', 'ad']).optional(),
				datePreset: z.string().optional().describe('today, yesterday, last_7d, last_30d, last_month, etc.'),
				timeRange: z.object({ since: z.string(), until: z.string() }).optional(),
				breakdowns: z.array(z.string()).optional(),
				limit: z.number().optional(),
				after: z.string().optional(),
			}),
		},

		{
			handle: 'getAdAccountInsights',
			description: 'Get account-level performance insights.',
			scopes: ['insights'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/insights',
			queryParams: {
				fields: '{{ input.fields }}',
				date_preset: '{{ input.datePreset }}',
				level: '{{ input.level }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional().describe('Comma-separated metric fields'),
				datePreset: z.string().optional().describe('Date preset (e.g. last_30d)'),
				level: z.string().optional().describe('Aggregation level: account, campaign, adset, ad'),
			}),
		},

		{
			handle: 'createCustomAudience',
			description: 'Create a custom audience.',
			scopes: ['audiences'],
			method: 'POST',
			endpoint: '/{{ input.actId }}/customaudiences',
			body: {
				name: '{{ input.name }}',
				subtype: '{{ input.subtype }}',
				description: '{{ input.description }}',
				customer_file_source: '{{ input.customerFileSource }}',
				retention_days: '{{ input.retentionDays }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				name: z.string(),
				subtype: z.string().describe('CUSTOM, WEBSITE, APP, OFFLINE_CONVERSION, etc.'),
				description: z.string().optional(),
				customerFileSource: z.string().optional().describe('USER_PROVIDED_ONLY, PARTNER_PROVIDED_ONLY, etc.'),
				retentionDays: z.number().optional(),
			}),
		},

		{
			handle: 'getAudiences',
			description: 'List custom audiences for an ad account.',
			scopes: ['audiences'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/customaudiences',
			queryParams: {
				fields: '{{ input.fields }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional().describe('Comma-separated fields to return'),
				limit: z.number().optional(),
			}),
		},

		{
			handle: 'getAdCreatives',
			description: 'Get ad creatives for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/adcreatives',
			queryParams: {
				fields: '{{ input.fields }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional().describe('Comma-separated fields to return'),
				limit: z.number().optional(),
			}),
		},

		{
			handle: 'createAdCreative',
			description: 'Create an ad creative.',
			scopes: ['campaigns.write'],
			method: 'POST',
			endpoint: '/{{ input.actId }}/adcreatives',
			body: {
				name: '{{ input.name }}',
				object_story_spec: '{{ input.objectStorySpec }}',
				image_hash: '{{ input.imageHash }}',
				image_url: '{{ input.imageUrl }}',
				title: '{{ input.title }}',
				body: '{{ input.body }}',
				call_to_action: '{{ input.callToAction }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				name: z.string(),
				objectStorySpec: z.record(z.unknown()).optional().describe('Object story spec for the creative'),
				imageHash: z.string().optional(),
				imageUrl: z.string().optional(),
				title: z.string().optional(),
				body: z.string().optional(),
				callToAction: z.record(z.unknown()).optional(),
			}),
		},

		{
			handle: 'getDeliveryEstimate',
			description: 'Get a delivery estimate for an ad set.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.adsetId }}/delivery_estimate',
			queryParams: {
				optimization_goal: '{{ input.optimizationGoal }}',
				promote_object: '{{ input.promoteObject }}',
			},
			inputSchema: z.object({
				adsetId: z.string(),
				optimizationGoal: z.string(),
				promoteObject: z.record(z.unknown()).optional(),
			}),
		},
	],
};
