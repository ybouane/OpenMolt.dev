/**
 * @module integrations/x
 * X (Twitter) API v2 integration definition.
 *
 * Authentication notes:
 *  - config.apiKey   — Bearer token (App-only auth) for read-only endpoints.
 *  - config.accessToken — OAuth 2.0 user access token for user-context write operations
 *    (posting tweets, likes, follows, bookmarks, retweets).
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const xDefinition: IntegrationDefinition = {
	name: 'X',
	instructions: `
### Two Types of Tokens
- \`config.apiKey\` is an **App-only Bearer token** — works for read endpoints (lookups, search, public timelines) but **cannot post** or act as a user.
- \`config.accessToken\` is a **user-context OAuth 2.0 token** — required for any write action (tweet, like, follow, retweet, bookmark, DM). Write tools in this integration automatically switch the Authorization header to \`accessToken\`.

### API Tiers & Rate Limits
- The X API has strict tiers: Free, Basic, Pro, Enterprise. The **Free tier cannot search or read the timeline** — it's write-only with very low caps (e.g. ~500 posts/month). Most useful read endpoints require **Basic+**.
- Rate-limit headers (\`x-rate-limit-remaining\`, \`x-rate-limit-reset\`) indicate when to back off. A \`429\` means you've hit the cap.

### Fields Parameter System
- By default, responses return a minimal set of fields. To get more, request \`tweet.fields\`, \`user.fields\`, \`media.fields\`, etc. as **comma-separated strings** (e.g. \`tweet.fields=created_at,public_metrics,entities\`).
- \`expansions\` pulls in referenced objects (e.g. \`expansions=author_id,referenced_tweets.id\`) which arrive in an \`includes\` block alongside \`data\`.

### Character Counting
- The 280-char limit counts **weighted** characters: URLs always count as 23, most CJK chars as 2. Emojis count as 2. Plan for this when composing tweets programmatically.

### Threading
- To post a thread, create the first tweet, then for each subsequent tweet set \`reply.in_reply_to_tweet_id\` to the previous tweet's \`id\` from the response.

### Media
- Media must be uploaded via the legacy v1.1 \`media/upload\` endpoint (chunked for video). The v2 \`createTweet\` only accepts \`media_ids\` returned by that upload. Max 4 images or 1 video/GIF per tweet.

### Search
- \`query\` uses X's search operator syntax: \`from:username\`, \`to:username\`, \`#hashtag\`, \`lang:en\`, \`-is:retweet\`, \`has:media\`, \`place:\`. Combine with AND (implicit) / OR. Quote phrases: \`"exact phrase"\`.
- Recent search reaches back ~7 days on most tiers. Full-archive search needs Pro/Enterprise.

### Pagination
- Cursor-based: response includes \`meta.next_token\`. Pass it as \`pagination_token\` on the next call. \`max_results\` varies by endpoint (usually 10–100).

### Errors
- Partial failures return \`200\` with an \`errors\` array alongside \`data\`. Always inspect both — a \`data\` block doesn't mean everything succeeded.
`,
	apiSetup: {
		baseUrl: 'https://api.twitter.com/2',
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
		read: 'Read tweets, users, timelines, and search results',
		write: 'Post tweets, likes, follows, retweets, and bookmarks (requires OAuth 2.0 user access token in config.accessToken)',
		dm: 'Send and receive direct messages',
	},
	tools: [
		// ── Tweets (Write) ────────────────────────────────────────────────────────

		{
			handle: 'createTweet',
			description: 'Post a new tweet on behalf of the authenticated user. Requires a user-context OAuth 2.0 access token (config.accessToken). Supports replies, polls, media attachments, and geo tags.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/tweets',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			body: {
				text: '{{ input.text }}',
				reply: '{{ input.reply }}',
				poll: '{{ input.poll }}',
				media: '{{ input.media }}',
				geo: '{{ input.geo }}',
				direct_message_deep_link: '{{ input.direct_message_deep_link }}',
				for_super_followers_only: '{{ input.for_super_followers_only }}',
			},
			inputSchema: z.object({
				text: z.string().max(280).describe('Text content of the tweet (max 280 characters)'),
				reply: z.object({
					in_reply_to_tweet_id: z.string().describe('ID of the tweet to reply to'),
					exclude_reply_user_ids: z.array(z.string()).optional().describe('User IDs to exclude from the reply @mention'),
				}).optional().describe('Reply configuration — set in_reply_to_tweet_id to make this a reply'),
				poll: z.object({
					options: z.array(z.string()).min(2).max(4).describe('Poll options (2–4 strings, each max 25 chars)'),
					duration_minutes: z.number().int().min(5).max(10080).describe('Poll duration in minutes (5 min to 7 days)'),
				}).optional().describe('Poll configuration — cannot be combined with media'),
				media: z.object({
					media_ids: z.array(z.string()).max(4).describe('Array of media IDs (from the Twitter media upload API)'),
					tagged_user_ids: z.array(z.string()).optional().describe('User IDs to tag in the media'),
				}).optional().describe('Media attachment configuration'),
				geo: z.object({
					place_id: z.string().describe('Place ID from the Twitter geo search API'),
				}).optional().describe('Geo location for the tweet'),
				direct_message_deep_link: z.string().optional().describe('URL to open a DM conversation (used with call-to-action prompts)'),
				for_super_followers_only: z.boolean().optional().describe('Whether to restrict the tweet to Super Followers only'),
			}),
		},

		{
			handle: 'deleteTweet',
			description: 'Delete a tweet by its ID. The authenticated user must be the author of the tweet. Requires OAuth 2.0 user context.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/tweets/{{ input.id }}',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the tweet to delete'),
			}),
		},

		// ── Tweets (Read) ─────────────────────────────────────────────────────────

		{
			handle: 'getTweet',
			description: 'Retrieve a single tweet by its ID. Use tweet_fields and expansions to request additional data like author info and media.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/tweets/{{ input.id }}',
			queryParams: {
				'tweet.fields': '{{ input.tweet_fields }}',
				expansions: '{{ input.expansions }}',
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the tweet to retrieve'),
				tweet_fields: z.string().optional().describe('Comma-separated list of tweet fields (e.g. "author_id,created_at,public_metrics,lang")'),
				expansions: z.string().optional().describe('Comma-separated expansions (e.g. "author_id,attachments.media_keys")'),
				user_fields: z.string().optional().describe('Comma-separated user fields when expanding author_id (e.g. "username,profile_image_url")'),
			}),
		},

		{
			handle: 'searchRecentTweets',
			description: 'Search tweets from the last 7 days using the Twitter search query language. Supports operators like "from:user", "#hashtag", and "-filter:retweets".',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/tweets/search/recent',
			queryParams: {
				query: '{{ input.query }}',
				max_results: '{{ input.max_results }}',
				start_time: '{{ input.start_time }}',
				end_time: '{{ input.end_time }}',
				next_token: '{{ input.next_token }}',
				'tweet.fields': '{{ input.tweet_fields }}',
				expansions: '{{ input.expansions }}',
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				query: z.string().max(512).describe('Twitter search query string (max 512 chars). Supports operators like "from:user", "#tag", "-filter:retweets"'),
				max_results: z.number().int().min(10).max(100).optional().describe('Number of results per page (10–100, default 10)'),
				start_time: z.string().optional().describe('ISO 8601 start time for results (e.g. "2024-01-01T00:00:00Z")'),
				end_time: z.string().optional().describe('ISO 8601 end time for results'),
				next_token: z.string().optional().describe('Pagination token from a previous response\'s meta.next_token'),
				tweet_fields: z.string().optional().describe('Comma-separated tweet fields to include'),
				expansions: z.string().optional().describe('Comma-separated expansions'),
				user_fields: z.string().optional().describe('Comma-separated user fields (requires author_id expansion)'),
			}),
		},

		{
			handle: 'searchAllTweets',
			description: 'Search all historical tweets (full archive). Requires Twitter API Academic Research or Pro access tier.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/tweets/search/all',
			queryParams: {
				query: '{{ input.query }}',
				max_results: '{{ input.max_results }}',
				start_time: '{{ input.start_time }}',
				end_time: '{{ input.end_time }}',
				next_token: '{{ input.next_token }}',
				'tweet.fields': '{{ input.tweet_fields }}',
			},
			inputSchema: z.object({
				query: z.string().max(1024).describe('Twitter search query string (Academic/Pro tier; max 1024 chars)'),
				max_results: z.number().int().min(10).max(500).optional().describe('Number of results per page (10–500, default 10)'),
				start_time: z.string().optional().describe('ISO 8601 start time (earliest tweet date)'),
				end_time: z.string().optional().describe('ISO 8601 end time (latest tweet date)'),
				next_token: z.string().optional().describe('Pagination token from a previous response'),
				tweet_fields: z.string().optional().describe('Comma-separated tweet fields to include'),
			}),
		},

		// ── Users ─────────────────────────────────────────────────────────────────

		{
			handle: 'getUserByUsername',
			description: 'Look up a Twitter user by their @username. Useful for resolving usernames to user IDs.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/by/username/{{ input.username }}',
			queryParams: {
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				username: z.string().describe('Twitter username without the @ symbol (e.g. "elonmusk")'),
				user_fields: z.string().optional().describe('Comma-separated user fields (e.g. "name,description,public_metrics,profile_image_url")'),
			}),
		},

		{
			handle: 'getUserById',
			description: 'Look up a Twitter user by their numeric user ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.id }}',
			queryParams: {
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric Twitter user ID'),
				user_fields: z.string().optional().describe('Comma-separated user fields to include in the response'),
			}),
		},

		{
			handle: 'getUserTimeline',
			description: 'Retrieve tweets authored by a specific user, sorted reverse-chronologically. Excludes retweets and replies by default.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.id }}/tweets',
			queryParams: {
				max_results: '{{ input.max_results }}',
				start_time: '{{ input.start_time }}',
				end_time: '{{ input.end_time }}',
				pagination_token: '{{ input.pagination_token }}',
				'tweet.fields': '{{ input.tweet_fields }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric Twitter user ID whose timeline to fetch'),
				max_results: z.number().int().min(5).max(100).optional().describe('Number of tweets to return (5–100, default 10)'),
				start_time: z.string().optional().describe('ISO 8601 start time for the tweet window'),
				end_time: z.string().optional().describe('ISO 8601 end time for the tweet window'),
				pagination_token: z.string().optional().describe('Pagination token from a previous response'),
				tweet_fields: z.string().optional().describe('Comma-separated tweet fields to include'),
			}),
		},

		{
			handle: 'getUserMentions',
			description: 'Retrieve tweets that mention a specific user, sorted reverse-chronologically.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.id }}/mentions',
			queryParams: {
				max_results: '{{ input.max_results }}',
				start_time: '{{ input.start_time }}',
				end_time: '{{ input.end_time }}',
				pagination_token: '{{ input.pagination_token }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric Twitter user ID to get mentions for'),
				max_results: z.number().int().min(5).max(100).optional().describe('Number of mentions to return (5–100, default 10)'),
				start_time: z.string().optional().describe('ISO 8601 start time'),
				end_time: z.string().optional().describe('ISO 8601 end time'),
				pagination_token: z.string().optional().describe('Pagination token from a previous response'),
			}),
		},

		// ── Social Graph ──────────────────────────────────────────────────────────

		{
			handle: 'followUser',
			description: 'Follow a Twitter user. Requires OAuth 2.0 user context (config.accessToken). The source user is the authenticated user.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.id }}/following',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			body: {
				target_user_id: '{{ input.target_user_id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID of the authenticated user initiating the follow'),
				target_user_id: z.string().describe('Numeric user ID of the user to follow'),
			}),
		},

		{
			handle: 'unfollowUser',
			description: 'Unfollow a Twitter user. Requires OAuth 2.0 user context (config.accessToken).',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/users/{{ input.source_user_id }}/following/{{ input.target_user_id }}',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			inputSchema: z.object({
				source_user_id: z.string().describe('Numeric user ID of the authenticated user who is unfollowing'),
				target_user_id: z.string().describe('Numeric user ID of the user to unfollow'),
			}),
		},

		{
			handle: 'getUserFollowers',
			description: 'Get a list of users who follow the specified account.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.id }}/followers',
			queryParams: {
				max_results: '{{ input.max_results }}',
				pagination_token: '{{ input.pagination_token }}',
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID to get followers for'),
				max_results: z.number().int().min(1).max(1000).optional().describe('Number of followers to return per page (1–1000, default 100)'),
				pagination_token: z.string().optional().describe('Pagination token from a previous response'),
				user_fields: z.string().optional().describe('Comma-separated user fields to include'),
			}),
		},

		{
			handle: 'getUserFollowing',
			description: 'Get a list of accounts that the specified user follows.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.id }}/following',
			queryParams: {
				max_results: '{{ input.max_results }}',
				pagination_token: '{{ input.pagination_token }}',
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID to get following list for'),
				max_results: z.number().int().min(1).max(1000).optional().describe('Number of accounts to return per page (1–1000, default 100)'),
				pagination_token: z.string().optional().describe('Pagination token from a previous response'),
				user_fields: z.string().optional().describe('Comma-separated user fields to include'),
			}),
		},

		// ── Likes ─────────────────────────────────────────────────────────────────

		{
			handle: 'likeTweet',
			description: 'Like a tweet on behalf of the authenticated user. Requires OAuth 2.0 user context (config.accessToken).',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.id }}/likes',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			body: {
				tweet_id: '{{ input.tweet_id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID of the authenticated user who is liking'),
				tweet_id: z.string().describe('ID of the tweet to like'),
			}),
		},

		{
			handle: 'unlikeTweet',
			description: 'Remove a like from a tweet. Requires OAuth 2.0 user context (config.accessToken).',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/users/{{ input.id }}/likes/{{ input.tweet_id }}',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID of the authenticated user'),
				tweet_id: z.string().describe('ID of the tweet to unlike'),
			}),
		},

		// ── Retweets ──────────────────────────────────────────────────────────────

		{
			handle: 'retweetTweet',
			description: 'Retweet a tweet on behalf of the authenticated user. Requires OAuth 2.0 user context (config.accessToken).',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.id }}/retweets',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			body: {
				tweet_id: '{{ input.tweet_id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID of the authenticated user who is retweeting'),
				tweet_id: z.string().describe('ID of the tweet to retweet'),
			}),
		},

		// ── Bookmarks ─────────────────────────────────────────────────────────────

		{
			handle: 'bookmarkTweet',
			description: 'Save a tweet to the authenticated user\'s bookmarks. Requires OAuth 2.0 user context (config.accessToken).',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.id }}/bookmarks',
			headers: {
				Authorization: 'Bearer {{ config.accessToken }}',
			},
			body: {
				tweet_id: '{{ input.tweet_id }}',
			},
			inputSchema: z.object({
				id: z.string().describe('Numeric user ID of the authenticated user'),
				tweet_id: z.string().describe('ID of the tweet to bookmark'),
			}),
		},

		// ── Authenticated User ────────────────────────────────────────────────────

		{
			handle: 'getMe',
			description: 'Get the Twitter user object for the currently authenticated user. Requires either app-level or user-level auth.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/me',
			queryParams: {
				'user.fields': '{{ input.user_fields }}',
			},
			inputSchema: z.object({
				user_fields: z.string().optional().describe('Comma-separated user fields to include (e.g. "username,name,public_metrics,description")'),
			}),
		},

		// ── Trends ────────────────────────────────────────────────────────────────

		{
			handle: 'getTrends',
			description: 'Get trending topics for a given Yahoo! Where On Earth ID (WOEID). Uses the Twitter v1.1 trends endpoint. WOEID 1 = worldwide.',
			scopes: ['read'],
			method: 'GET',
			endpoint: 'https://api.twitter.com/1.1/trends/place.json',
			queryParams: {
				id: '{{ input.woeid }}',
			},
			inputSchema: z.object({
				woeid: z.number().int().describe('Yahoo! Where On Earth ID for the location (1 = worldwide, 23424977 = United States, etc.)'),
			}),
		},
	],
};
