/**
 * @module integrations/instagram
 * Instagram Graph API v20.0 integration definition.
 * Uses a Facebook User Access Token with the appropriate Instagram permissions.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const instagramDefinition: IntegrationDefinition = {
	name: 'Instagram',
	apiSetup: {
		baseUrl: 'https://graph.facebook.com/v20.0',
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			'Content-Type': 'application/json',
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
		content: 'Read profile, media, and publish content (images, videos, reels, carousels)',
		insights: 'Access media and account-level analytics and insights',
		comments: 'Read, reply to, and delete comments on owned media',
		messages: 'Access @mentions and tagged media',
	},
	tools: [
		// ── Profile ───────────────────────────────────────────────────────────────

		{
			handle: 'getProfile',
			description: 'Get the Instagram Business or Creator profile for a given Instagram User ID. Returns fields like biography, follower count, media count, and website.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/{{ input.userId }}',
			queryParams: {
				fields: '{{ input.fields }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram Business Account user ID (the numeric IG user ID, not the Facebook Page ID)'),
				fields: z.string().optional().default('id,name,biography,followers_count,media_count,profile_picture_url,username,website').describe('Comma-separated list of fields to return'),
			}),
		},

		// ── Media ─────────────────────────────────────────────────────────────────

		{
			handle: 'getMedia',
			description: 'Retrieve a paginated list of media objects (posts, reels, carousels) published by the Instagram account.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/{{ input.userId }}/media',
			queryParams: {
				fields: '{{ input.fields }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to retrieve media for'),
				fields: z.string().optional().describe('Comma-separated media fields (e.g. "id,caption,media_type,media_url,timestamp,like_count,comments_count")'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of media objects to return per page (default 12, max 100)'),
				after: z.string().optional().describe('Cursor for forward pagination (from cursors.after in previous response)'),
			}),
		},

		{
			handle: 'getMediaDetails',
			description: 'Retrieve details of a specific Instagram media object by its ID, including caption, media URL, type, and engagement counts.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/{{ input.mediaId }}',
			queryParams: {
				fields: '{{ input.fields }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				mediaId: z.string().describe('Instagram media object ID'),
				fields: z.string().optional().describe('Comma-separated fields to return (e.g. "id,caption,media_type,media_url,thumbnail_url,timestamp,permalink,like_count,comments_count")'),
			}),
		},

		// ── Content Publishing ────────────────────────────────────────────────────

		{
			handle: 'createImageContainer',
			description: 'Create an image media container as the first step in the two-step Instagram content publishing process. Call publishMedia after creation.',
			scopes: ['content'],
			method: 'POST',
			endpoint: '/{{ input.userId }}/media',
			body: {
				image_url: '{{ input.imageUrl }}',
				caption: '{{ input.caption }}',
				location_id: '{{ input.locationId }}',
				user_tags: '{{ input.userTags }}',
				is_carousel_item: '{{ input.isCarouselItem }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to create the container for'),
				imageUrl: z.string().url().describe('Publicly accessible HTTPS URL of the image to post (JPEG or PNG)'),
				caption: z.string().max(2200).optional().describe('Caption text for the post (max 2200 characters, up to 30 hashtags)'),
				locationId: z.string().optional().describe('Facebook Location Page ID to tag in the post'),
				userTags: z.array(z.object({
					username: z.string(),
					x: z.number().min(0).max(1).describe('Horizontal position (0.0–1.0)'),
					y: z.number().min(0).max(1).describe('Vertical position (0.0–1.0)'),
				})).optional().describe('Array of user tags with position coordinates'),
				isCarouselItem: z.boolean().optional().describe('Set to true when creating a container that will be part of a carousel'),
			}),
		},

		{
			handle: 'createVideoContainer',
			description: 'Create a video or Reel media container as the first step in publishing. Use mediaType REELS for short-form video. Call publishMedia after the container status is FINISHED.',
			scopes: ['content'],
			method: 'POST',
			endpoint: '/{{ input.userId }}/media',
			body: {
				video_url: '{{ input.videoUrl }}',
				media_type: '{{ input.mediaType }}',
				caption: '{{ input.caption }}',
				location_id: '{{ input.locationId }}',
				share_to_feed: '{{ input.shareToFeed }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to create the container for'),
				videoUrl: z.string().url().describe('Publicly accessible HTTPS URL of the video to post'),
				mediaType: z.enum(['REELS']).describe('Media type — use REELS for short-form video content'),
				caption: z.string().max(2200).optional().describe('Caption text for the Reel'),
				locationId: z.string().optional().describe('Facebook Location Page ID to tag'),
				shareToFeed: z.boolean().optional().describe('Whether the Reel should also appear in the main feed (default true)'),
			}),
		},

		{
			handle: 'createCarouselContainer',
			description: 'Create a carousel (multi-image/video) media container from previously created carousel item containers. Call publishMedia after creation.',
			scopes: ['content'],
			method: 'POST',
			endpoint: '/{{ input.userId }}/media',
			body: {
				media_type: 'CAROUSEL',
				children: '{{ input.children }}',
				caption: '{{ input.caption }}',
				location_id: '{{ input.locationId }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to create the carousel for'),
				children: z.array(z.string()).min(2).max(10).describe('Array of media container IDs (created with isCarouselItem: true) to include in the carousel (2–10 items)'),
				caption: z.string().max(2200).optional().describe('Caption text for the carousel post'),
				locationId: z.string().optional().describe('Facebook Location Page ID to tag'),
			}),
		},

		{
			handle: 'publishMedia',
			description: 'Publish a previously created media container (image, video, Reel, or carousel) to the Instagram feed. This is step two of the two-step publishing process.',
			scopes: ['content'],
			method: 'POST',
			endpoint: '/{{ input.userId }}/media_publish',
			body: {
				creation_id: '{{ input.creationId }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to publish for'),
				creationId: z.string().describe('ID of the media container returned by createImageContainer, createVideoContainer, or createCarouselContainer'),
			}),
		},

		{
			handle: 'getContainerStatus',
			description: 'Check the processing status of a media container before publishing. Wait until status is FINISHED before calling publishMedia.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/{{ input.containerId }}',
			queryParams: {
				fields: '{{ input.fields }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				containerId: z.string().describe('ID of the media container to check'),
				fields: z.string().optional().default('id,status,status_code').describe('Comma-separated fields to return (status_code values: EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED)'),
			}),
		},

		// ── Comments ──────────────────────────────────────────────────────────────

		{
			handle: 'getComments',
			description: 'Retrieve comments on a specific Instagram media object. Supports pagination.',
			scopes: ['comments'],
			method: 'GET',
			endpoint: '/{{ input.mediaId }}/comments',
			queryParams: {
				fields: '{{ input.fields }}',
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				mediaId: z.string().describe('Instagram media object ID to get comments for'),
				fields: z.string().optional().describe('Comma-separated comment fields (e.g. "id,text,username,timestamp,like_count,replies")'),
				limit: z.number().int().min(1).max(50).optional().describe('Number of comments per page (default 10, max 50)'),
				after: z.string().optional().describe('Pagination cursor from a previous response'),
			}),
		},

		{
			handle: 'replyToComment',
			description: 'Post a reply to a comment on an Instagram media object owned by the authenticated account.',
			scopes: ['comments'],
			method: 'POST',
			endpoint: '/{{ input.commentId }}/replies',
			body: {
				message: '{{ input.message }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				commentId: z.string().describe('ID of the comment to reply to'),
				message: z.string().max(2200).describe('Text of the reply'),
			}),
		},

		{
			handle: 'deleteComment',
			description: 'Delete a comment on an Instagram media object owned by the authenticated account, or a comment that mentions the account.',
			scopes: ['comments'],
			method: 'DELETE',
			endpoint: '/{{ input.commentId }}',
			queryParams: {
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				commentId: z.string().describe('ID of the comment to delete'),
			}),
		},

		// ── Insights ──────────────────────────────────────────────────────────────

		{
			handle: 'getInsights',
			description: 'Get analytics metrics for a specific Instagram media post (impressions, reach, likes, comments, shares, saves, etc.).',
			scopes: ['insights'],
			method: 'GET',
			endpoint: '/{{ input.mediaId }}/insights',
			queryParams: {
				metric: '{{ input.metric }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				mediaId: z.string().describe('Instagram media object ID to retrieve insights for'),
				metric: z.string().describe('Comma-separated list of metrics to retrieve (e.g. "impressions,reach,likes,comments,shares,saves,video_views")'),
			}),
		},

		{
			handle: 'getAccountInsights',
			description: 'Get account-level analytics for an Instagram Business or Creator account over a specified period.',
			scopes: ['insights'],
			method: 'GET',
			endpoint: '/{{ input.userId }}/insights',
			queryParams: {
				metric: '{{ input.metric }}',
				period: '{{ input.period }}',
				since: '{{ input.since }}',
				until: '{{ input.until }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to get account insights for'),
				metric: z.string().describe('Comma-separated list of account metrics (e.g. "impressions,reach,follower_count,profile_views,website_clicks")'),
				period: z.enum(['day', 'week', 'month', 'lifetime']).describe('Aggregation period for the metrics'),
				since: z.number().int().optional().describe('Unix timestamp for the start of the date range (used with period=day)'),
				until: z.number().int().optional().describe('Unix timestamp for the end of the date range (used with period=day)'),
			}),
		},

		// ── Hashtags ──────────────────────────────────────────────────────────────

		{
			handle: 'searchHashtag',
			description: 'Get the Instagram hashtag ID for a given hashtag string. The ID is required for getHashtagTopMedia.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/ig_hashtag_search',
			queryParams: {
				user_id: '{{ input.userId }}',
				q: '{{ input.q }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID making the request (used for rate limiting)'),
				q: z.string().describe('Hashtag to search for, without the # symbol (e.g. "caturday")'),
			}),
		},

		{
			handle: 'getHashtagTopMedia',
			description: 'Get the top-performing public media for a hashtag. Limited to 30 unique hashtag searches per account per 7 days.',
			scopes: ['content'],
			method: 'GET',
			endpoint: '/{{ input.hashtagId }}/top_media',
			queryParams: {
				user_id: '{{ input.userId }}',
				fields: '{{ input.fields }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				hashtagId: z.string().describe('Hashtag ID retrieved from searchHashtag'),
				userId: z.string().describe('Instagram user ID making the request'),
				fields: z.string().optional().describe('Comma-separated fields to return (e.g. "id,caption,media_type,media_url,permalink,timestamp")'),
			}),
		},

		// ── Mentions ──────────────────────────────────────────────────────────────

		{
			handle: 'getMentionedMedia',
			description: 'Get a list of media objects in which the Instagram account has been tagged (i.e. @mentioned or tagged in a photo).',
			scopes: ['messages'],
			method: 'GET',
			endpoint: '/{{ input.userId }}/tags',
			queryParams: {
				fields: '{{ input.fields }}',
				access_token: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				userId: z.string().describe('Instagram user ID to get tagged media for'),
				fields: z.string().optional().describe('Comma-separated fields to return for each tagged media object (e.g. "id,caption,media_type,media_url,timestamp,permalink")'),
			}),
		},
	],
};
