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
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

const GADS_BASE = 'https://googleads.googleapis.com/v18';

function gadsHeaders(context: ToolContext): Record<string, string> {
	const config = context.config ?? {};
	const headers: Record<string, string> = {
		Authorization: `Bearer ${config.accessToken ?? ''}`,
		'developer-token': String(config.developerToken ?? ''),
		'Content-Type': 'application/json',
	};
	if (config.managerCustomerId) {
		headers['login-customer-id'] = String(config.managerCustomerId);
	}
	return headers;
}

async function gadsSearch(
	customerId: string,
	query: string,
	context: ToolContext,
	pageSize?: number,
	pageToken?: string,
): Promise<unknown> {
	const body: Record<string, unknown> = { query };
	if (pageSize !== undefined) body.pageSize = pageSize;
	if (pageToken) body.pageToken = pageToken;
	const response = await fetch(`${GADS_BASE}/customers/${customerId}/googleAds:search`, {
		method: 'POST',
		headers: gadsHeaders(context),
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Google Ads search failed (${response.status}): ${err}`);
	}
	return response.json();
}

export const googleAdsDefinition: IntegrationDefinition = {
	name: 'Google Ads',
	apiSetup: {
		baseUrl: GADS_BASE,
		headers: {
			Authorization: 'Bearer {{ config.accessToken }}',
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
			handle: 'getCampaigns',
			description: 'Get campaigns for a Google Ads customer, optionally filtered by status.',
			scopes: ['campaigns.read'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, status, pageSize } = input as {
					customerId: string;
					status?: string;
					pageSize?: number;
				};
				let query = `SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.bidding_strategy_type, campaign.start_date, campaign.end_date, campaign.serving_status, campaign.resource_name FROM campaign`;
				if (status) query += ` WHERE campaign.status = '${status}'`;
				query += ' ORDER BY campaign.name';
				return gadsSearch(customerId, query, context, pageSize);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				status: z.enum(['ENABLED', 'PAUSED', 'REMOVED']).optional().describe('Filter campaigns by status'),
				pageSize: z.number().int().min(1).max(10000).optional().describe('Number of results per page'),
			}),
		},

		{
			handle: 'createCampaign',
			description: 'Create a new Google Ads campaign with budget and bidding strategy.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const {
					customerId,
					campaignName,
					advertisingChannelType,
					status = 'PAUSED',
					biddingStrategyType,
					budgetAmountMicros,
					startDate,
					endDate,
					networkSettings,
				} = input as Record<string, unknown>;

				const operations: unknown[] = [];

				// Create budget first
				if (budgetAmountMicros !== undefined) {
					operations.push({
						create: {
							name: `Budget for ${campaignName}`,
							amount_micros: budgetAmountMicros,
							delivery_method: 'STANDARD',
						},
					});
				}

				const campaign: Record<string, unknown> = {
					name: campaignName,
					advertising_channel_type: advertisingChannelType,
					status,
				};
				if (biddingStrategyType) campaign.manual_cpc = {};
				if (startDate) campaign.start_date = startDate;
				if (endDate) campaign.end_date = endDate;
				if (networkSettings) campaign.network_settings = networkSettings;

				// Mutate campaigns
				const response = await fetch(`${GADS_BASE}/customers/${customerId}/campaigns:mutate`, {
					method: 'POST',
					headers: gadsHeaders(context),
					body: JSON.stringify({ operations: [{ create: campaign }] }),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Google Ads createCampaign failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				campaignName: z.string().describe('Campaign name'),
				advertisingChannelType: z.string().describe('Channel type: SEARCH, DISPLAY, SHOPPING, VIDEO, SMART, PERFORMANCE_MAX'),
				status: z.string().optional().describe('Initial status: ENABLED or PAUSED (defaults to PAUSED)'),
				biddingStrategyType: z.string().optional().describe('Bidding strategy type (e.g. MANUAL_CPC, TARGET_CPA)'),
				budgetAmountMicros: z.number().int().optional().describe('Daily budget in micros (1 unit = 1,000,000 micros)'),
				startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
				endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
				networkSettings: z.record(z.unknown()).optional().describe('Network settings object'),
			}),
		},

		{
			handle: 'updateCampaign',
			description: 'Update an existing Google Ads campaign status or name.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, campaignResourceName, status, name } = input as Record<string, unknown>;
				const campaign: Record<string, unknown> = { resource_name: campaignResourceName };
				const updateMask: string[] = [];
				if (status !== undefined) { campaign.status = status; updateMask.push('status'); }
				if (name !== undefined) { campaign.name = name; updateMask.push('name'); }
				const response = await fetch(`${GADS_BASE}/customers/${customerId}/campaigns:mutate`, {
					method: 'POST',
					headers: gadsHeaders(context),
					body: JSON.stringify({ operations: [{ update: campaign, update_mask: updateMask.join(',') }] }),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Google Ads updateCampaign failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				campaignResourceName: z.string().describe('Campaign resource name (e.g. customers/123/campaigns/456)'),
				status: z.string().optional().describe('New status: ENABLED, PAUSED, or REMOVED'),
				name: z.string().optional().describe('New campaign name'),
			}),
		},

		// ── Ad Groups ────────────────────────────────────────────────────────────

		{
			handle: 'getAdGroups',
			description: 'Get ad groups for a customer, optionally filtered by campaign and status.',
			scopes: ['campaigns.read'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, campaignResourceName, status } = input as Record<string, unknown>;
				let query = `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.cpc_bid_micros, ad_group.campaign, ad_group.resource_name FROM ad_group`;
				const conditions: string[] = [];
				if (campaignResourceName) conditions.push(`ad_group.campaign = '${campaignResourceName}'`);
				if (status) conditions.push(`ad_group.status = '${status}'`);
				if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
				query += ' ORDER BY ad_group.name';
				return gadsSearch(String(customerId), query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				campaignResourceName: z.string().optional().describe('Filter by campaign resource name'),
				status: z.string().optional().describe('Filter by status: ENABLED, PAUSED, REMOVED'),
			}),
		},

		{
			handle: 'createAdGroup',
			description: 'Create a new ad group within a campaign.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, name, campaignResourceName, status = 'ENABLED', type = 'SEARCH_STANDARD', cpcBidMicros } = input as Record<string, unknown>;
				const adGroup: Record<string, unknown> = {
					name,
					campaign: campaignResourceName,
					status,
					type,
				};
				if (cpcBidMicros !== undefined) adGroup.cpc_bid_micros = cpcBidMicros;
				const response = await fetch(`${GADS_BASE}/customers/${customerId}/adGroups:mutate`, {
					method: 'POST',
					headers: gadsHeaders(context),
					body: JSON.stringify({ operations: [{ create: adGroup }] }),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Google Ads createAdGroup failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				name: z.string().describe('Ad group name'),
				campaignResourceName: z.string().describe('Parent campaign resource name'),
				status: z.string().optional().describe('Initial status: ENABLED or PAUSED'),
				type: z.string().optional().describe('Ad group type (e.g. SEARCH_STANDARD, DISPLAY_STANDARD)'),
				cpcBidMicros: z.number().int().optional().describe('Max CPC bid in micros'),
			}),
		},

		// ── Ads ──────────────────────────────────────────────────────────────────

		{
			handle: 'getAds',
			description: 'Get ads for a customer, optionally filtered by ad group and status.',
			scopes: ['campaigns.read'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, adGroupResourceName, status } = input as Record<string, unknown>;
				let query = `SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.status, ad_group_ad.ad_group, ad_group_ad.resource_name FROM ad_group_ad`;
				const conditions: string[] = [];
				if (adGroupResourceName) conditions.push(`ad_group_ad.ad_group = '${adGroupResourceName}'`);
				if (status) conditions.push(`ad_group_ad.status = '${status}'`);
				if (conditions.length > 0) query += ` WHERE ${conditions.join(' AND ')}`;
				return gadsSearch(String(customerId), query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				adGroupResourceName: z.string().optional().describe('Filter by ad group resource name'),
				status: z.string().optional().describe('Filter by status: ENABLED, PAUSED, REMOVED'),
			}),
		},

		// ── Budgets ──────────────────────────────────────────────────────────────

		{
			handle: 'getBudgets',
			description: 'Get all campaign budgets for a Google Ads customer.',
			scopes: ['campaigns.read'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId } = input as Record<string, unknown>;
				const query = `SELECT campaign_budget.id, campaign_budget.name, campaign_budget.amount_micros, campaign_budget.delivery_method, campaign_budget.explicitly_shared, campaign_budget.status, campaign_budget.resource_name FROM campaign_budget ORDER BY campaign_budget.name`;
				return gadsSearch(String(customerId), query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
			}),
		},

		{
			handle: 'createBudget',
			description: 'Create a new campaign budget.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, name, amountMicros, deliveryMethod = 'STANDARD', explicitlyShared = false } = input as Record<string, unknown>;
				const budget: Record<string, unknown> = {
					name,
					amount_micros: amountMicros,
					delivery_method: deliveryMethod,
					explicitly_shared: explicitlyShared,
				};
				const response = await fetch(`${GADS_BASE}/customers/${customerId}/campaignBudgets:mutate`, {
					method: 'POST',
					headers: gadsHeaders(context),
					body: JSON.stringify({ operations: [{ create: budget }] }),
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Google Ads createBudget failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				name: z.string().describe('Budget name'),
				amountMicros: z.number().int().describe('Daily budget amount in micros (1,000,000 micros = 1 currency unit)'),
				deliveryMethod: z.string().optional().describe('Budget delivery: STANDARD or ACCELERATED'),
				explicitlyShared: z.boolean().optional().describe('Whether this budget is shared across campaigns'),
			}),
		},

		// ── Keywords ─────────────────────────────────────────────────────────────

		{
			handle: 'getKeywords',
			description: 'Get keywords for a customer, optionally filtered by ad group and status.',
			scopes: ['keywords'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId, adGroupResourceName, status } = input as Record<string, unknown>;
				let query = `SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros, ad_group_criterion.quality_info.quality_score, ad_group_criterion.ad_group, ad_group_criterion.resource_name FROM ad_group_criterion WHERE ad_group_criterion.type = 'KEYWORD'`;
				if (adGroupResourceName) query += ` AND ad_group_criterion.ad_group = '${adGroupResourceName}'`;
				if (status) query += ` AND ad_group_criterion.status = '${status}'`;
				return gadsSearch(String(customerId), query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				adGroupResourceName: z.string().optional().describe('Filter by ad group resource name'),
				status: z.string().optional().describe('Filter by status: ENABLED, PAUSED, REMOVED'),
			}),
		},

		// ── Conversions ───────────────────────────────────────────────────────────

		{
			handle: 'getConversions',
			description: 'Get conversion actions configured for a Google Ads customer.',
			scopes: ['reports'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const { customerId } = input as Record<string, unknown>;
				const query = `SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category, conversion_action.value_settings.default_value, conversion_action.resource_name FROM conversion_action ORDER BY conversion_action.name`;
				return gadsSearch(String(customerId), query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
			}),
		},

		// ── Metrics ──────────────────────────────────────────────────────────────

		{
			handle: 'getMetrics',
			description: 'Get campaign performance metrics for a date range, including impressions, clicks, cost, and conversions.',
			scopes: ['reports'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const {
					customerId,
					campaignResourceName,
					startDate,
					endDate,
					metrics = ['impressions', 'clicks', 'cost_micros', 'conversions', 'ctr'],
				} = input as {
					customerId: string;
					campaignResourceName?: string;
					startDate: string;
					endDate: string;
					metrics?: string[];
				};

				const metricFields = (metrics as string[]).map((m) => `metrics.${m}`).join(', ');
				let query = `SELECT campaign.id, campaign.name, campaign.status, ${metricFields} FROM campaign WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`;
				if (campaignResourceName) query += ` AND campaign.resource_name = '${campaignResourceName}'`;
				query += ' ORDER BY metrics.cost_micros DESC';
				return gadsSearch(customerId, query, context);
			},
			inputSchema: z.object({
				customerId: z.string().describe('Google Ads customer ID'),
				campaignResourceName: z.string().optional().describe('Filter to a specific campaign resource name'),
				startDate: z.string().describe('Start date in YYYY-MM-DD format'),
				endDate: z.string().describe('End date in YYYY-MM-DD format'),
				metrics: z.array(z.string()).optional().describe('GAQL metric field names (without the "metrics." prefix). Defaults to impressions, clicks, cost_micros, conversions, ctr'),
			}),
		},
	],
};
