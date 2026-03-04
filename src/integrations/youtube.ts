/**
 * @module integrations/youtube
 * YouTube Data API v3 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const youtubeDefinition: IntegrationDefinition = {
	name: 'YouTube',
	apiSetup: {
		baseUrl: 'https://www.googleapis.com/youtube/v3',
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
			authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
			tokenUrl: 'https://oauth2.googleapis.com/token',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: [
				'https://www.googleapis.com/auth/youtube',
				'https://www.googleapis.com/auth/youtube.upload',
				'https://www.googleapis.com/auth/youtube.force-ssl',
			],
		},
		{
			type: 'custom',
			queryParams: {
				key: '{{ config.apiKey }}',
			},
		},
	],
	scopes: {
		read: 'Read public YouTube data (videos, channels, playlists)',
		write: 'Manage playlists, subscriptions, and comments',
		upload: 'Upload videos to YouTube',
		comments: 'Read and post comments on videos',
	},
	tools: [
		{
			handle: 'searchVideos',
			description: 'Search YouTube for videos, channels, or playlists matching a query string with optional filters.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/search',
			queryParams: {
				q: '{{ input.q }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				type: '{{ input.type }}',
				order: '{{ input.order }}',
				publishedAfter: '{{ input.publishedAfter }}',
				publishedBefore: '{{ input.publishedBefore }}',
				channelId: '{{ input.channelId }}',
				videoCategoryId: '{{ input.videoCategoryId }}',
				regionCode: '{{ input.regionCode }}',
				relevanceLanguage: '{{ input.relevanceLanguage }}',
				part: 'snippet',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				q: z.string().describe('Search query string'),
				maxResults: z.number().int().min(0).max(50).optional().describe('Maximum number of results (max 50)'),
				pageToken: z.string().optional().describe('Pagination token for the next or previous page'),
				type: z.string().optional().describe('Resource type to filter: video, channel, or playlist'),
				order: z.enum(['date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount']).optional().describe('Sort order for results'),
				publishedAfter: z.string().optional().describe('Only return resources created after this ISO 8601 datetime'),
				publishedBefore: z.string().optional().describe('Only return resources created before this ISO 8601 datetime'),
				channelId: z.string().optional().describe('Restrict results to a specific channel ID'),
				videoCategoryId: z.string().optional().describe('Filter by YouTube video category ID'),
				regionCode: z.string().optional().describe('Boost results relevant to this ISO 3166-1 alpha-2 country code'),
				relevanceLanguage: z.string().optional().describe('Boost results relevant to this BCP-47 language'),
			}),
		},

		{
			handle: 'getVideo',
			description: 'Get detailed information about one or more YouTube videos by their IDs.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/videos',
			queryParams: {
				id: '{{ input.id }}',
				part: '{{ input.part || "snippet,contentDetails,statistics" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Comma-separated list of YouTube video IDs'),
				part: z.string().optional().describe('Comma-separated list of resource parts to include (default: snippet,contentDetails,statistics)'),
			}),
		},

		{
			handle: 'getChannel',
			description: 'Get details about one or more YouTube channels by ID, username, or the authenticated user.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/channels',
			queryParams: {
				id: '{{ input.id }}',
				forUsername: '{{ input.forUsername }}',
				mine: '{{ input.mine }}',
				part: '{{ input.part || "snippet,contentDetails,statistics" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				id: z.string().optional().describe('Comma-separated list of channel IDs'),
				forUsername: z.string().optional().describe('YouTube username to look up the channel for'),
				mine: z.boolean().optional().describe('Set to true to return the authenticated user\'s channel'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet,contentDetails,statistics)'),
			}),
		},

		{
			handle: 'listVideos',
			description: 'List videos from a specific YouTube channel using a search query.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/search',
			queryParams: {
				channelId: '{{ input.channelId }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				order: '{{ input.order }}',
				part: '{{ input.part || "snippet" }}',
				type: 'video',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				channelId: z.string().describe('The YouTube channel ID whose videos to list'),
				maxResults: z.number().int().min(0).max(50).optional().describe('Maximum number of results (max 50)'),
				pageToken: z.string().optional().describe('Pagination token for next or previous page'),
				order: z.enum(['date', 'rating', 'relevance', 'title', 'viewCount']).optional().describe('Sort order for results'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet)'),
			}),
		},

		{
			handle: 'listPlaylists',
			description: 'List playlists for a specific channel or the authenticated user.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/playlists',
			queryParams: {
				channelId: '{{ input.channelId }}',
				mine: '{{ input.mine }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				part: '{{ input.part || "snippet,contentDetails" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				channelId: z.string().optional().describe('Return playlists belonging to this channel ID'),
				mine: z.boolean().optional().describe('Set to true to return the authenticated user\'s playlists'),
				maxResults: z.number().int().min(0).max(50).optional().describe('Maximum number of results (max 50)'),
				pageToken: z.string().optional().describe('Pagination token'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet,contentDetails)'),
			}),
		},

		{
			handle: 'getPlaylist',
			description: 'Get details about a specific YouTube playlist by its ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/playlists',
			queryParams: {
				id: '{{ input.id }}',
				part: '{{ input.part || "snippet,contentDetails,status" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The YouTube playlist ID'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet,contentDetails,status)'),
			}),
		},

		{
			handle: 'createPlaylist',
			description: 'Create a new YouTube playlist for the authenticated user.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/playlists',
			queryParams: {
				part: 'snippet,status',
			},
			body: {
				snippet: {
					title: '{{ input.title }}',
					description: '{{ input.description }}',
					defaultLanguage: '{{ input.defaultLanguage }}',
				},
				status: {
					privacyStatus: '{{ input.privacyStatus || "public" }}',
				},
			},
			inputSchema: z.object({
				title: z.string().describe('Title for the new playlist'),
				description: z.string().optional().describe('Description for the playlist'),
				privacyStatus: z.enum(['public', 'unlisted', 'private']).optional().describe('Visibility of the playlist (default: public)'),
				defaultLanguage: z.string().optional().describe('BCP-47 language code for the playlist\'s default language'),
			}),
		},

		{
			handle: 'addToPlaylist',
			description: 'Add a video to a YouTube playlist at an optional position.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/playlistItems',
			queryParams: {
				part: 'snippet',
			},
			body: {
				snippet: {
					playlistId: '{{ input.playlistId }}',
					resourceId: {
						kind: 'youtube#video',
						videoId: '{{ input.videoId }}',
					},
					position: '{{ input.position }}',
				},
			},
			inputSchema: z.object({
				playlistId: z.string().describe('The playlist ID to add the video to'),
				videoId: z.string().describe('The YouTube video ID to add'),
				position: z.number().int().min(0).optional().describe('Zero-based position in the playlist to insert the video'),
			}),
		},

		{
			handle: 'removeFromPlaylist',
			description: 'Remove a video from a playlist by its playlistItem ID.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/playlistItems',
			queryParams: {
				id: '{{ input.id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The playlistItem ID to remove (not the video ID — use getPlaylistItems to find it)'),
			}),
		},

		{
			handle: 'getPlaylistItems',
			description: 'Get the videos contained in a YouTube playlist.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/playlistItems',
			queryParams: {
				playlistId: '{{ input.playlistId }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				part: '{{ input.part || "snippet,contentDetails" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				playlistId: z.string().describe('The playlist ID to list items for'),
				maxResults: z.number().int().min(0).max(50).optional().describe('Maximum number of items to return (max 50)'),
				pageToken: z.string().optional().describe('Pagination token for the next or previous page'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet,contentDetails)'),
			}),
		},

		{
			handle: 'getComments',
			description: 'Get comment threads for a YouTube video or channel.',
			scopes: ['comments'],
			method: 'GET',
			endpoint: '/commentThreads',
			queryParams: {
				videoId: '{{ input.videoId }}',
				channelId: '{{ input.channelId }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				order: '{{ input.order }}',
				searchTerms: '{{ input.searchTerms }}',
				part: '{{ input.part || "snippet,replies" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				videoId: z.string().optional().describe('Return comment threads for this video ID'),
				channelId: z.string().optional().describe('Return comment threads for this channel ID'),
				maxResults: z.number().int().min(1).max(100).optional().describe('Maximum number of comment threads (max 100)'),
				pageToken: z.string().optional().describe('Pagination token'),
				order: z.enum(['time', 'relevance']).optional().describe('Sort comments by time or relevance'),
				searchTerms: z.string().optional().describe('Limit results to comments containing these terms'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet,replies)'),
			}),
		},

		{
			handle: 'postComment',
			description: 'Post a top-level comment on a YouTube video.',
			scopes: ['comments'],
			method: 'POST',
			endpoint: '/commentThreads',
			queryParams: {
				part: 'snippet',
			},
			body: {
				snippet: {
					videoId: '{{ input.videoId }}',
					channelId: '{{ input.channelId }}',
					topLevelComment: {
						snippet: {
							textOriginal: '{{ input.text }}',
						},
					},
				},
			},
			inputSchema: z.object({
				videoId: z.string().describe('The YouTube video ID to post the comment on'),
				text: z.string().describe('The comment text to post'),
				channelId: z.string().optional().describe('The channel ID associated with the video (required for some channels)'),
			}),
		},

		{
			handle: 'likeVideo',
			description: 'Rate a YouTube video as like, dislike, or remove rating.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/videos/rate',
			queryParams: {
				id: '{{ input.id }}',
				rating: '{{ input.rating }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The YouTube video ID to rate'),
				rating: z.enum(['like', 'dislike', 'none']).describe('The rating to apply (use "none" to remove an existing rating)'),
			}),
		},

		{
			handle: 'getVideoCategories',
			description: 'Get a list of YouTube video categories available in a specified region.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/videoCategories',
			queryParams: {
				regionCode: '{{ input.regionCode || "US" }}',
				hl: '{{ input.hl || "en_US" }}',
				part: '{{ input.part || "snippet" }}',
				key: '{{ config.apiKey }}',
			},
			inputSchema: z.object({
				regionCode: z.string().optional().describe('ISO 3166-1 alpha-2 country code for available categories (default: US)'),
				hl: z.string().optional().describe('BCP-47 language for category names (default: en_US)'),
				part: z.string().optional().describe('Comma-separated list of resource parts (default: snippet)'),
			}),
		},

		{
			handle: 'subscribeToChannel',
			description: 'Subscribe the authenticated user to a YouTube channel.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/subscriptions',
			queryParams: {
				part: 'snippet',
			},
			body: {
				snippet: {
					resourceId: {
						kind: 'youtube#channel',
						channelId: '{{ input.channelId }}',
					},
				},
			},
			inputSchema: z.object({
				channelId: z.string().describe('The YouTube channel ID to subscribe to'),
			}),
		},

		{
			handle: 'unsubscribeFromChannel',
			description: 'Remove a subscription for the authenticated user by subscription ID.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/subscriptions',
			queryParams: {
				id: '{{ input.id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The subscription ID to remove (use listPlaylists or channel data to find it)'),
			}),
		},

		{
			handle: 'uploadVideo',
			description: 'Upload a video file to YouTube using the resumable upload API. Reads a local file path and uploads it.',
			scopes: ['upload'],
			execute: async (input, context) => {
				const accessToken = context.config?.accessToken as string;

				const metadata = {
					snippet: {
						title: input.title,
						description: input.description || '',
						tags: input.tags || [],
						categoryId: input.categoryId || '22',
					},
					status: {
						privacyStatus: input.privacyStatus || 'private',
					},
				};

				// Step 1: Initiate the resumable upload session
				const initResponse = await fetch(
					'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': 'application/json; charset=UTF-8',
							'X-Upload-Content-Type': (input.mimeType as string) || 'video/*',
						},
						body: JSON.stringify(metadata),
					},
				);

				if (!initResponse.ok) {
					const err = await initResponse.text();
					throw new Error(`Failed to initiate upload: ${initResponse.status} ${err}`);
				}

				const uploadUrl = initResponse.headers.get('Location');
				if (!uploadUrl) {
					throw new Error('No upload URL returned from YouTube resumable upload initiation');
				}

				// Step 2: Read the local video file and upload it
				const fs = await import('fs');
				const path = input.videoFilePath as string;
				const fileBuffer = fs.readFileSync(path);
				const mimeType = (input.mimeType as string) || 'video/mp4';

				const uploadResponse = await fetch(uploadUrl, {
					method: 'PUT',
					headers: {
						'Content-Type': mimeType,
						'Content-Length': String(fileBuffer.length),
					},
					body: fileBuffer,
				});

				if (!uploadResponse.ok) {
					const err = await uploadResponse.text();
					throw new Error(`Upload failed: ${uploadResponse.status} ${err}`);
				}

				return uploadResponse.json();
			},
			inputSchema: z.object({
				videoFilePath: z.string().describe('Absolute local file path to the video file to upload'),
				title: z.string().describe('Video title (max 100 characters)'),
				description: z.string().optional().describe('Video description'),
				tags: z.array(z.string()).optional().describe('Array of tags for the video'),
				categoryId: z.string().optional().describe('YouTube video category ID (default: 22 = People & Blogs)'),
				privacyStatus: z.enum(['public', 'unlisted', 'private']).optional().describe('Video privacy setting (default: private)'),
				mimeType: z.string().optional().describe('MIME type of the video file (default: video/mp4)'),
			}),
		},
	],
};
