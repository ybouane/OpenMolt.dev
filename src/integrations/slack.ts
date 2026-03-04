/**
 * @module integrations/slack
 * Slack Web API integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const slackDefinition: IntegrationDefinition = {
	name: 'Slack',
	apiSetup: {
		baseUrl: 'https://slack.com/api',
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			'Content-Type': 'application/json; charset=utf-8',
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
		chat: 'Post, update, delete, and schedule messages',
		channels: 'List, create, archive, and manage channels',
		users: 'Read user and profile information',
		files: 'Upload and list files',
		reactions: 'Add and remove emoji reactions',
		search: 'Search messages and files',
	},
	tools: [
		// ── Chat ─────────────────────────────────────────────────────────────────

		{
			handle: 'postMessage',
			description: 'Post a message to a Slack channel, DM, or MPIM. Supports Block Kit blocks, legacy attachments, threads, and custom bot appearance.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/chat.postMessage',
			body: {
				channel: '{{ input.channel }}',
				text: '{{ input.text }}',
				blocks: '{{ input.blocks }}',
				attachments: '{{ input.attachments }}',
				thread_ts: '{{ input.thread_ts }}',
				reply_broadcast: '{{ input.reply_broadcast }}',
				unfurl_links: '{{ input.unfurl_links }}',
				unfurl_media: '{{ input.unfurl_media }}',
				username: '{{ input.username }}',
				icon_emoji: '{{ input.icon_emoji }}',
				icon_url: '{{ input.icon_url }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID, user ID, or conversation ID to send the message to'),
				text: z.string().optional().describe('Fallback text for the message (required if blocks is not provided)'),
				blocks: z.array(z.record(z.unknown())).optional().describe('Array of Block Kit layout blocks'),
				attachments: z.array(z.record(z.unknown())).optional().describe('Array of legacy attachment objects'),
				thread_ts: z.string().optional().describe('Timestamp of a parent message to reply to in a thread'),
				reply_broadcast: z.boolean().optional().describe('Whether a thread reply should also appear in the channel'),
				unfurl_links: z.boolean().optional().describe('Whether to unfurl primarily text-based content'),
				unfurl_media: z.boolean().optional().describe('Whether to unfurl media content'),
				username: z.string().optional().describe('Custom username to display for the message (requires chat:write.customize scope)'),
				icon_emoji: z.string().optional().describe('Emoji to use as the icon for the message (e.g. ":robot_face:")'),
				icon_url: z.string().optional().describe('URL of an image to use as the icon for the message'),
			}),
		},

		{
			handle: 'updateMessage',
			description: 'Update an existing message in a Slack channel. Identified by channel and message timestamp.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/chat.update',
			body: {
				channel: '{{ input.channel }}',
				ts: '{{ input.ts }}',
				text: '{{ input.text }}',
				blocks: '{{ input.blocks }}',
				attachments: '{{ input.attachments }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID containing the message to update'),
				ts: z.string().describe('Timestamp of the message to update (acts as the message ID in Slack)'),
				text: z.string().optional().describe('New text for the message'),
				blocks: z.array(z.record(z.unknown())).optional().describe('New array of Block Kit layout blocks'),
				attachments: z.array(z.record(z.unknown())).optional().describe('New array of legacy attachment objects'),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Delete a message from a Slack channel. Bots can only delete their own messages unless they have admin privileges.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/chat.delete',
			body: {
				channel: '{{ input.channel }}',
				ts: '{{ input.ts }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID containing the message to delete'),
				ts: z.string().describe('Timestamp of the message to delete'),
			}),
		},

		{
			handle: 'getPermalink',
			description: 'Retrieve a permanent URL for a specific message in a channel.',
			scopes: ['chat'],
			method: 'GET',
			endpoint: '/chat.getPermalink',
			queryParams: {
				channel: '{{ input.channel }}',
				message_ts: '{{ input.message_ts }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('The ID of the channel containing the message'),
				message_ts: z.string().describe('Timestamp of the message to get a permalink for'),
			}),
		},

		{
			handle: 'scheduleMessage',
			description: 'Schedule a message to be posted to a channel at a future time specified as a Unix timestamp.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/chat.scheduleMessage',
			body: {
				channel: '{{ input.channel }}',
				post_at: '{{ input.post_at }}',
				text: '{{ input.text }}',
				blocks: '{{ input.blocks }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID to schedule the message in'),
				post_at: z.number().int().describe('Unix timestamp (seconds) for when the message should be posted'),
				text: z.string().optional().describe('Text of the message'),
				blocks: z.array(z.record(z.unknown())).optional().describe('Array of Block Kit layout blocks'),
			}),
		},

		// ── Conversations (Channels) ──────────────────────────────────────────────

		{
			handle: 'listChannels',
			description: 'List all channels (public, private, DMs, MPIMs) that the bot has access to. Supports cursor-based pagination.',
			scopes: ['channels'],
			method: 'GET',
			endpoint: '/conversations.list',
			queryParams: {
				types: '{{ input.types }}',
				limit: '{{ input.limit }}',
				cursor: '{{ input.cursor }}',
				exclude_archived: '{{ input.exclude_archived }}',
			},
			inputSchema: z.object({
				types: z.string().optional().describe('Comma-separated list of channel types to include: public_channel, private_channel, mpim, im'),
				limit: z.number().int().min(1).max(1000).optional().describe('Number of results to return per page (default 100, max 1000)'),
				cursor: z.string().optional().describe('Pagination cursor from a previous response\'s response_metadata.next_cursor'),
				exclude_archived: z.boolean().optional().describe('Whether to exclude archived channels from the results'),
			}),
		},

		{
			handle: 'getChannel',
			description: 'Get detailed information about a specific channel by its ID.',
			scopes: ['channels'],
			method: 'GET',
			endpoint: '/conversations.info',
			queryParams: {
				channel: '{{ input.channel }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('The ID of the channel to retrieve information for'),
			}),
		},

		{
			handle: 'createChannel',
			description: 'Create a new public or private channel in the workspace.',
			scopes: ['channels'],
			method: 'POST',
			endpoint: '/conversations.create',
			body: {
				name: '{{ input.name }}',
				is_private: '{{ input.is_private }}',
			},
			inputSchema: z.object({
				name: z.string().describe('Name of the channel to create (lowercase, no spaces, max 80 chars)'),
				is_private: z.boolean().optional().describe('Whether to create a private channel (default false = public)'),
			}),
		},

		{
			handle: 'archiveChannel',
			description: 'Archive a channel, preventing new messages from being posted while preserving its history.',
			scopes: ['channels'],
			method: 'POST',
			endpoint: '/conversations.archive',
			body: {
				channel: '{{ input.channel }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('The ID of the channel to archive'),
			}),
		},

		{
			handle: 'inviteToChannel',
			description: 'Invite one or more users to a channel. The caller must be a member of the channel.',
			scopes: ['channels'],
			method: 'POST',
			endpoint: '/conversations.invite',
			body: {
				channel: '{{ input.channel }}',
				users: '{{ input.users }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('The ID of the channel to invite users to'),
				users: z.string().describe('Comma-separated list of user IDs to invite'),
			}),
		},

		{
			handle: 'getChannelHistory',
			description: 'Fetch messages from a channel\'s history. Supports pagination and filtering by time range.',
			scopes: ['channels'],
			method: 'GET',
			endpoint: '/conversations.history',
			queryParams: {
				channel: '{{ input.channel }}',
				limit: '{{ input.limit }}',
				cursor: '{{ input.cursor }}',
				oldest: '{{ input.oldest }}',
				latest: '{{ input.latest }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('The ID of the channel to fetch history for'),
				limit: z.number().int().min(1).max(999).optional().describe('Number of messages to return (default 100, max 999)'),
				cursor: z.string().optional().describe('Pagination cursor from a previous response'),
				oldest: z.string().optional().describe('Only return messages after this Unix timestamp'),
				latest: z.string().optional().describe('Only return messages before this Unix timestamp'),
			}),
		},

		// ── Users ─────────────────────────────────────────────────────────────────

		{
			handle: 'listUsers',
			description: 'List all users in the workspace. Supports pagination via cursor.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users.list',
			queryParams: {
				limit: '{{ input.limit }}',
				cursor: '{{ input.cursor }}',
				include_locale: '{{ input.include_locale }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(1000).optional().describe('Number of users to return per page (max 1000)'),
				cursor: z.string().optional().describe('Pagination cursor from a previous response'),
				include_locale: z.boolean().optional().describe('Whether to include each user\'s locale in the response'),
			}),
		},

		{
			handle: 'getUserInfo',
			description: 'Get detailed profile information about a specific Slack user by their user ID.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users.info',
			queryParams: {
				user: '{{ input.user }}',
			},
			inputSchema: z.object({
				user: z.string().describe('The ID of the user to retrieve information for'),
			}),
		},

		{
			handle: 'lookupUserByEmail',
			description: 'Look up a Slack user by their email address. Requires users:read.email scope.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users.lookupByEmail',
			queryParams: {
				email: '{{ input.email }}',
			},
			inputSchema: z.object({
				email: z.string().email().describe('The email address of the user to look up'),
			}),
		},

		// ── Files ─────────────────────────────────────────────────────────────────

		{
			handle: 'uploadFile',
			description: 'Upload a file to Slack and optionally share it in one or more channels.',
			scopes: ['files'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const apiKey = context.config?.apiKey as string;
				if (!apiKey) throw new Error('Slack API key (config.apiKey) is required');

				const formData = new FormData();
				if (input.channels) formData.append('channels', input.channels as string);
				formData.append('content', input.content as string);
				formData.append('filename', input.filename as string);
				if (input.title) formData.append('title', input.title as string);
				if (input.filetype) formData.append('filetype', input.filetype as string);

				const response = await fetch('https://slack.com/api/files.upload', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${apiKey}`,
					},
					body: formData,
				});

				if (!response.ok) {
					throw new Error(`Slack files.upload HTTP error: ${response.status} ${response.statusText}`);
				}

				const data = await response.json() as Record<string, unknown>;
				if (!data.ok) {
					throw new Error(`Slack files.upload error: ${data.error}`);
				}

				return data;
			},
			inputSchema: z.object({
				channels: z.string().optional().describe('Comma-separated list of channel IDs to share the file in'),
				content: z.string().describe('Text content of the file to upload'),
				filename: z.string().describe('Filename for the uploaded file (including extension)'),
				title: z.string().optional().describe('Title of the file'),
				filetype: z.string().optional().describe('File type identifier (e.g. "text", "python", "javascript")'),
			}),
		},

		{
			handle: 'listFiles',
			description: 'List files uploaded to the workspace. Can be filtered by channel, user, or file type.',
			scopes: ['files'],
			method: 'GET',
			endpoint: '/files.list',
			queryParams: {
				channel: '{{ input.channel }}',
				user: '{{ input.user }}',
				types: '{{ input.types }}',
				count: '{{ input.count }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				channel: z.string().optional().describe('Filter by files shared in this channel ID'),
				user: z.string().optional().describe('Filter by files uploaded by this user ID'),
				types: z.string().optional().describe('Comma-separated list of file types to filter (e.g. "images,snippets")'),
				count: z.number().int().min(1).max(1000).optional().describe('Number of files to return per page (default 100)'),
				page: z.number().int().min(1).optional().describe('Page number of results to return (default 1)'),
			}),
		},

		// ── Reactions ────────────────────────────────────────────────────────────

		{
			handle: 'addReaction',
			description: 'Add an emoji reaction to a message.',
			scopes: ['reactions'],
			method: 'POST',
			endpoint: '/reactions.add',
			body: {
				channel: '{{ input.channel }}',
				timestamp: '{{ input.timestamp }}',
				name: '{{ input.name }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID containing the message'),
				timestamp: z.string().describe('Timestamp of the message to react to'),
				name: z.string().describe('Name of the emoji to react with, without colons (e.g. "thumbsup")'),
			}),
		},

		{
			handle: 'removeReaction',
			description: 'Remove an emoji reaction from a message.',
			scopes: ['reactions'],
			method: 'POST',
			endpoint: '/reactions.remove',
			body: {
				channel: '{{ input.channel }}',
				timestamp: '{{ input.timestamp }}',
				name: '{{ input.name }}',
			},
			inputSchema: z.object({
				channel: z.string().describe('Channel ID containing the message'),
				timestamp: z.string().describe('Timestamp of the message to remove the reaction from'),
				name: z.string().describe('Name of the emoji to remove, without colons (e.g. "thumbsup")'),
			}),
		},

		// ── Search ────────────────────────────────────────────────────────────────

		{
			handle: 'searchMessages',
			description: 'Search for messages across the workspace using a query string. Supports sorting by relevance or timestamp.',
			scopes: ['search'],
			method: 'GET',
			endpoint: '/search.messages',
			queryParams: {
				query: '{{ input.query }}',
				count: '{{ input.count }}',
				page: '{{ input.page }}',
				sort: '{{ input.sort }}',
				sort_dir: '{{ input.sort_dir }}',
			},
			inputSchema: z.object({
				query: z.string().describe('Search query string. Supports Slack search modifiers like "in:#channel" or "from:@user"'),
				count: z.number().int().min(1).max(100).optional().describe('Number of results per page (default 20, max 100)'),
				page: z.number().int().min(1).optional().describe('Page number of results to return'),
				sort: z.enum(['score', 'timestamp']).optional().describe('Sort results by relevance score or timestamp'),
				sort_dir: z.enum(['asc', 'desc']).optional().describe('Sort direction (ascending or descending)'),
			}),
		},

		// ── Auth ─────────────────────────────────────────────────────────────────

		{
			handle: 'getBotInfo',
			description: 'Test the authentication token and retrieve information about the bot or user that owns it.',
			scopes: ['chat'],
			method: 'GET',
			endpoint: '/auth.test',
			inputSchema: z.object({}),
		},
	],
};
