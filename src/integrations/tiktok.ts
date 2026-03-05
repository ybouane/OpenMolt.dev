/**
 * @module integrations/tiktok
 * TikTok for Developers Content Posting API and Research API integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const tiktokDefinition: IntegrationDefinition = {
	name: 'TikTok',
	apiSetup: {
		baseUrl: 'https://open.tiktokapis.com/v2',
		headers: {
			Authorization: 'Bearer {{ config.accessToken }}',
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'oauth2',
			authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
			tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: ['user.info.basic', 'video.list', 'video.upload'],
		},
	],
	scopes: {
		user: 'Read user profile information',
		'video.read': 'Read and query user videos',
		'video.write': 'Upload and post videos',
		research: 'Access TikTok Research API for video/hashtag/user data',
	},
	tools: [
		{
			handle: 'getUserInfo',
			description: 'Get the authenticated TikTok user\'s profile information including follower counts, verification status, and bio.',
			scopes: ['user'],
			method: 'GET',
			endpoint: '/user/info/',
			queryParams: {
				fields: '{{ input.fields || "open_id,union_id,avatar_url,avatar_url_100,avatar_large_url,display_name,bio_description,profile_deep_link,is_verified,follower_count,following_count,likes_count,video_count" }}',
			},
			inputSchema: z.object({
				fields: z.string().optional().describe('Comma-separated list of fields to return. Defaults to all standard profile fields.'),
			}),
		},

		{
			handle: 'listVideos',
			description: 'Get a paginated list of videos posted by the authenticated user.',
			scopes: ['video.read'],
			method: 'POST',
			endpoint: '/video/list/',
			queryParams: {
				fields: '{{ input.fields || "id,title,video_description,duration,cover_image_url,embed_link,like_count,comment_count,share_count,view_count,create_time" }}',
			},
			body: {
				cursor: '{{ input.cursor }}',
				max_count: '{{ input.max_count }}',
			},
			inputSchema: z.object({
				fields: z.string().optional().describe('Comma-separated list of video fields to return'),
				cursor: z.number().int().optional().describe('Pagination cursor (Unix timestamp in milliseconds)'),
				max_count: z.number().int().min(1).max(20).optional().describe('Maximum number of videos to return per page (max 20)'),
			}),
		},

		{
			handle: 'getVideoDetails',
			description: 'Get detailed information for one or more specific TikTok videos by their IDs.',
			scopes: ['video.read'],
			method: 'POST',
			endpoint: '/video/query/',
			body: {
				filters: {
					video_ids: '{{ input.videoIds }}',
				},
				fields: '{{ input.fields || "id,title,video_description,duration,cover_image_url,embed_link,like_count,comment_count,share_count,view_count,create_time" }}',
			},
			inputSchema: z.object({
				videoIds: z.array(z.string()).max(20).describe('Array of video IDs to retrieve details for (max 20)'),
				fields: z.string().optional().describe('Comma-separated list of video fields to return'),
			}),
		},

		{
			handle: 'uploadVideoInit',
			description: 'Initialize a video upload session. Returns a publish_id. Set source to PULL_FROM_URL and provide videoUrl to have TikTok pull the video from a URL, or use FILE_UPLOAD for direct uploads.',
			scopes: ['video.write'],
			method: 'POST',
			endpoint: 'https://open.tiktokapis.com/v2/post/video/init/',
			body: {
				post_info: {
					title: '{{ input.title }}',
					privacy_level: '{{ input.privacyLevel }}',
					disable_comment: '{{ input.disableComment }}',
					disable_duet: '{{ input.disableDuet }}',
					disable_stitch: '{{ input.disableStitch }}',
					video_cover_timestamp_ms: '{{ input.videoCoverTimestampMs }}',
				},
				source_info: {
					source: '{{ input.source }}',
					video_url: '{{ input.videoUrl }}',
				},
			},
			inputSchema: z.object({
				title: z.string().max(150).describe('Video title/caption (max 150 characters)'),
				privacyLevel: z.enum([
					'SELF_ONLY',
					'MUTUAL_FOLLOW_FRIENDS',
					'FOLLOWER_OF_CREATOR',
					'PUBLIC_TO_EVERYONE',
				]).describe('Who can see the video'),
				source: z.enum(['PULL_FROM_URL', 'FILE_UPLOAD']).default('PULL_FROM_URL').describe('Upload source type'),
				videoUrl: z.string().url().optional().describe('Public URL for TikTok to pull the video from (required when source is PULL_FROM_URL)'),
				disableComment: z.boolean().optional().describe('Disable comments on the video'),
				disableDuet: z.boolean().optional().describe('Disable duet for the video'),
				disableStitch: z.boolean().optional().describe('Disable stitch for the video'),
				videoCoverTimestampMs: z.number().int().optional().describe('Timestamp in milliseconds for the video cover frame'),
			}),
		},

		{
			handle: 'uploadVideoStatus',
			description: 'Check the status of a video upload or publishing process by its publish ID.',
			scopes: ['video.write'],
			method: 'POST',
			endpoint: '/post/video/status/fetch/',
			body: {
				publish_id: '{{ input.publishId }}',
			},
			inputSchema: z.object({
				publishId: z.string().describe('The publish ID returned from uploadVideoInit'),
			}),
		},

		{
			handle: 'searchVideos',
			description: 'Search for public TikTok videos using the Research API with complex query conditions.',
			scopes: ['research'],
			method: 'POST',
			endpoint: '/research/video/query/',
			body: {
				query: '{{ input.query }}',
				max_count: '{{ input.maxCount }}',
				cursor: '{{ input.cursor }}',
				start_date: '{{ input.startDate }}',
				end_date: '{{ input.endDate }}',
				fields: '{{ input.fields || "id,video_description,create_time,region_code,share_count,view_count,like_count,comment_count,music_id,hashtag_names,username,effect_ids,playlist_id,voice_to_text" }}',
			},
			inputSchema: z.object({
				query: z.object({
					and: z.array(z.record(z.unknown())).optional().describe('All conditions must match'),
					or: z.array(z.record(z.unknown())).optional().describe('At least one condition must match'),
					not: z.array(z.record(z.unknown())).optional().describe('None of the conditions must match'),
				}).describe('Query conditions using AND/OR/NOT operators with field conditions'),
				maxCount: z.number().int().min(1).max(100).optional().describe('Maximum number of results to return (max 100)'),
				cursor: z.number().int().optional().describe('Pagination cursor for the next page of results'),
				startDate: z.string().optional().describe('Start date for the search range (YYYYMMDD format)'),
				endDate: z.string().optional().describe('End date for the search range (YYYYMMDD format)'),
				fields: z.string().optional().describe('Comma-separated list of fields to return'),
			}),
		},

		{
			handle: 'getVideoComments',
			description: 'Retrieve comments for a specific TikTok video using the Research API.',
			scopes: ['research'],
			method: 'POST',
			endpoint: '/research/video/comment/list/',
			body: {
				video_id: '{{ input.videoId }}',
				max_count: '{{ input.maxCount }}',
				cursor: '{{ input.cursor }}',
				fields: '{{ input.fields || "id,video_id,text,like_count,reply_count,parent_comment_id,create_time" }}',
			},
			inputSchema: z.object({
				videoId: z.string().describe('The TikTok video ID to retrieve comments for'),
				maxCount: z.number().int().min(1).max(100).optional().describe('Maximum number of comments to return (max 100)'),
				cursor: z.number().int().optional().describe('Pagination cursor for the next page of comments'),
				fields: z.string().optional().describe('Comma-separated list of comment fields to return'),
			}),
		},

		{
			handle: 'getHashtagInfo',
			description: 'Get information about a TikTok hashtag including its video count and view count.',
			scopes: ['research'],
			method: 'GET',
			endpoint: '/research/hashtag/query/',
			queryParams: {
				hashtag_name: '{{ input.hashtag_name }}',
				fields: 'id,name,video_count,view_count',
			},
			inputSchema: z.object({
				hashtag_name: z.string().describe('The hashtag name to look up (without the # symbol)'),
			}),
		},

		{
			handle: 'listFollowers',
			description: 'List followers of a specified TikTok user using the Research API.',
			scopes: ['research'],
			method: 'POST',
			endpoint: '/research/user/followers/',
			body: {
				username: '{{ input.username }}',
				max_count: '{{ input.maxCount }}',
				cursor: '{{ input.cursor }}',
				fields: '{{ input.fields || "display_name,bio_description,avatar_url,is_verified,follower_count,following_count,likes_count" }}',
			},
			inputSchema: z.object({
				username: z.string().describe('The TikTok username whose followers to list'),
				maxCount: z.number().int().min(1).max(100).optional().describe('Maximum number of followers to return (max 100)'),
				cursor: z.number().int().optional().describe('Pagination cursor for the next page'),
				fields: z.string().optional().describe('Comma-separated list of user fields to return'),
			}),
		},

		{
			handle: 'listFollowing',
			description: 'List accounts that a specified TikTok user is following using the Research API.',
			scopes: ['research'],
			method: 'POST',
			endpoint: '/research/user/following/',
			body: {
				username: '{{ input.username }}',
				max_count: '{{ input.maxCount }}',
				cursor: '{{ input.cursor }}',
				fields: '{{ input.fields || "display_name,bio_description,avatar_url,is_verified,follower_count,following_count,likes_count" }}',
			},
			inputSchema: z.object({
				username: z.string().describe('The TikTok username whose following list to retrieve'),
				maxCount: z.number().int().min(1).max(100).optional().describe('Maximum number of accounts to return (max 100)'),
				cursor: z.number().int().optional().describe('Pagination cursor for the next page'),
				fields: z.string().optional().describe('Comma-separated list of user fields to return'),
			}),
		},
	],
};
