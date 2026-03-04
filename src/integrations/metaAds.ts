/**
 * @module integrations/metaAds
 * Meta (Facebook) Marketing API v20.0 integration definition.
 * Supports campaign, ad set, ad, and insights management.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const metaAdsDefinition: IntegrationDefinition = {
	name: 'Meta Ads',
	apiSetup: {
		baseUrl: 'https://graph.facebook.com/v20.0',
		headers: {
			'Content-Type': 'application/json',
		},
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
				fields: '{{ input.fields || "id,name,currency,account_status,timezone_name,spend_cap,amount_spent" }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				fields: z.string().optional().describe('Comma-separated fields to return'),
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
				fields: '{{ input.fields || "id,name,currency,account_status,timezone_name,spend_cap,amount_spent,business" }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				actId: z.string().describe('Ad account ID (e.g. act_123456)'),
				fields: z.string().optional(),
			}),
		},
		{
			handle: 'listCampaigns',
			description: 'List campaigns for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/campaigns',
			queryParams: {
				fields: '{{ input.fields || "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time" }}',
				effective_status: '{{ input.status }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				actId: z.string().describe('Ad account ID'),
				fields: z.string().optional(),
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
				fields: '{{ input.fields || "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,bid_strategy" }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				campaignId: z.string().describe('Campaign ID'),
				fields: z.string().optional(),
			}),
		},
		{
			handle: 'createCampaign',
			description: 'Create a new campaign.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const actId = input.actId as string;
				const params = new URLSearchParams();
				params.set('name', input.name as string);
				params.set('objective', input.objective as string);
				params.set('status', (input.status as string) || 'PAUSED');
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.specialAdCategories) {
					(input.specialAdCategories as string[]).forEach(c => params.append('special_ad_categories[]', c));
				}
				if (input.dailyBudget) params.set('daily_budget', String(input.dailyBudget));
				if (input.lifetimeBudget) params.set('lifetime_budget', String(input.lifetimeBudget));
				if (input.spendCap) params.set('spend_cap', String(input.spendCap));
				if (input.startTime) params.set('start_time', input.startTime as string);
				if (input.stopTime) params.set('stop_time', input.stopTime as string);
				if (input.buyingType) params.set('buying_type', input.buyingType as string);

				const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/campaigns`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const campaignId = input.campaignId as string;
				const params = new URLSearchParams();
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.name) params.set('name', input.name as string);
				if (input.status) params.set('status', input.status as string);
				if (input.dailyBudget) params.set('daily_budget', String(input.dailyBudget));
				if (input.lifetimeBudget) params.set('lifetime_budget', String(input.lifetimeBudget));
				if (input.spendCap) params.set('spend_cap', String(input.spendCap));

				const res = await fetch(`https://graph.facebook.com/v20.0/${campaignId}`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
			queryParams: { access_token: '{{ config.apiKey }}' },
			inputSchema: z.object({ campaignId: z.string() }),
		},
		{
			handle: 'listAdSets',
			description: 'List ad sets for an ad account.',
			scopes: ['campaigns.read'],
			method: 'GET',
			endpoint: '/{{ input.actId }}/adsets',
			queryParams: {
				fields: '{{ input.fields || "id,name,status,campaign_id,daily_budget,lifetime_budget,billing_event,optimization_goal,start_time,end_time,targeting" }}',
				effective_status: '{{ input.status }}',
				campaign_id: '{{ input.campaignId }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
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
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const actId = input.actId as string;
				const body: Record<string, unknown> = {
					name: input.name,
					campaign_id: input.campaignId,
					billing_event: input.billingEvent || 'IMPRESSIONS',
					optimization_goal: input.optimizationGoal,
					targeting: JSON.stringify(input.targeting),
					status: input.status || 'PAUSED',
					access_token: context.config?.apiKey,
				};
				if (input.dailyBudget) body.daily_budget = input.dailyBudget;
				if (input.lifetimeBudget) body.lifetime_budget = input.lifetimeBudget;
				if (input.startTime) body.start_time = input.startTime;
				if (input.endTime) body.end_time = input.endTime;
				if (input.bidAmount) body.bid_amount = input.bidAmount;

				const params = new URLSearchParams();
				for (const [k, v] of Object.entries(body)) {
					if (v !== undefined) params.set(k, String(v));
				}

				const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/adsets`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const adsetId = input.adsetId as string;
				const params = new URLSearchParams();
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.name) params.set('name', input.name as string);
				if (input.status) params.set('status', input.status as string);
				if (input.dailyBudget) params.set('daily_budget', String(input.dailyBudget));
				if (input.targeting) params.set('targeting', JSON.stringify(input.targeting));

				const res = await fetch(`https://graph.facebook.com/v20.0/${adsetId}`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
				fields: '{{ input.fields || "id,name,status,adset_id,campaign_id,creative,created_time,updated_time" }}',
				effective_status: '{{ input.status }}',
				adset_id: '{{ input.adsetId }}',
				campaign_id: '{{ input.campaignId }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
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
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const actId = input.actId as string;
				const params = new URLSearchParams();
				params.set('name', input.name as string);
				params.set('adset_id', input.adsetId as string);
				params.set('creative', JSON.stringify(input.creative));
				params.set('status', (input.status as string) || 'PAUSED');
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.trackingSpecs) params.set('tracking_specs', JSON.stringify(input.trackingSpecs));

				const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/ads`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
				fields: '{{ input.fields || "impressions,clicks,spend,cpm,ctr,reach,actions,conversions,cost_per_action_type" }}',
				level: '{{ input.level }}',
				date_preset: '{{ input.datePreset }}',
				time_range: '{{ input.timeRange }}',
				breakdowns: '{{ input.breakdowns }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
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
				fields: '{{ input.fields || "impressions,clicks,spend,cpm,ctr,reach,actions,conversions" }}',
				date_preset: '{{ input.datePreset || "last_30d" }}',
				level: '{{ input.level || "account" }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional(),
				datePreset: z.string().optional(),
				level: z.string().optional(),
			}),
		},
		{
			handle: 'createCustomAudience',
			description: 'Create a custom audience.',
			scopes: ['audiences'],
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const actId = input.actId as string;
				const params = new URLSearchParams();
				params.set('name', input.name as string);
				params.set('subtype', input.subtype as string);
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.description) params.set('description', input.description as string);
				if (input.customerFileSource) params.set('customer_file_source', input.customerFileSource as string);
				if (input.retentionDays) params.set('retention_days', String(input.retentionDays));

				const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/customaudiences`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
				fields: '{{ input.fields || "id,name,subtype,approximate_count,delivery_status,data_source" }}',
				limit: '{{ input.limit }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional(),
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
				fields: '{{ input.fields || "id,name,title,body,image_url,object_story_spec,call_to_action_type" }}',
				limit: '{{ input.limit }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				actId: z.string(),
				fields: z.string().optional(),
				limit: z.number().optional(),
			}),
		},
		{
			handle: 'createAdCreative',
			description: 'Create an ad creative.',
			scopes: ['campaigns.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const actId = input.actId as string;
				const params = new URLSearchParams();
				params.set('name', input.name as string);
				params.set('access_token', (context.config?.apiKey as string) || '');
				if (input.objectStorySpec) params.set('object_story_spec', JSON.stringify(input.objectStorySpec));
				if (input.imageHash) params.set('image_hash', input.imageHash as string);
				if (input.imageUrl) params.set('image_url', input.imageUrl as string);
				if (input.title) params.set('title', input.title as string);
				if (input.body) params.set('body', input.body as string);
				if (input.callToAction) params.set('call_to_action', JSON.stringify(input.callToAction));

				const res = await fetch(`https://graph.facebook.com/v20.0/${actId}/adcreatives`, {
					method: 'POST',
					body: params,
				});
				if (!res.ok) throw new Error(`Meta API error ${res.status}: ${await res.text()}`);
				return res.json();
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
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				adsetId: z.string(),
				optimizationGoal: z.string(),
				promoteObject: z.record(z.unknown()).optional(),
			}),
		},
	],
};
