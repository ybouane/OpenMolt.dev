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
