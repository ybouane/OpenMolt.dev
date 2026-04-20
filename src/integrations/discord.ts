/**
 * @module integrations/discord
 * Discord API v10 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const discordDefinition: IntegrationDefinition = {
	name: 'Discord',
	instructions: `
### Identifiers
All Discord IDs are 17–20 digit **snowflakes** delivered as strings. Do not truncate or cast them to numbers. Common ones: \`guild_id\` (server), \`channel_id\`, \`message_id\`, \`user_id\`, \`webhook_id\`.

### Discovering IDs
If you do not have the IDs you need, start with \`listGuilds\` → \`listChannels\` (with the chosen \`guild_id\`) → \`getMessages\` (with the chosen \`channel_id\`). \`getCurrentUser\` confirms the bot's own identity.

### Sending messages
- \`content\` is plain text capped at **2000 chars**. For long/formatted output, use Markdown or split across messages.
- To **reply** to a message, set \`message_reference\`:
\`\`\`json
{ "message_reference": { "message_id": "123...", "channel_id": "456..." } }
\`\`\`
- To **suppress @everyone / role pings**, pass \`"allowed_mentions": { "parse": [] }\`.
- Embeds let you post richer content. Shape (simplified):
\`\`\`json
{ "embeds": [{ "title": "Build failed", "description": "See logs", "color": 15158332, "fields": [{ "name": "Commit", "value": "abc123", "inline": true }] }] }
\`\`\`
Max 10 embeds per message.

### Editing
\`editMessage\` only works on messages **the bot itself sent**. Passing \`""\` clears text, \`[]\` clears embeds/components.

### Channel types (for \`createChannel\`)
0=text, 2=voice, 4=category, 5=announcement, 15=forum, 16=media. Use \`parent_id\` to nest a text/voice channel under a category.

### Reactions
\`addReaction\` requires the emoji to be URL-encoded in the path. For Unicode, pass the emoji character directly (e.g. \`"👍"\`). For custom emoji, use \`"name:id"\` (e.g. \`"partyparrot:123..."\`).

### Permissions
The bot needs its own permissions in the server. If a call fails with 403, the likely cause is a missing permission (\`MANAGE_MESSAGES\`, \`MANAGE_CHANNELS\`, \`KICK_MEMBERS\`, \`BAN_MEMBERS\`, \`MANAGE_WEBHOOKS\`, \`MANAGE_ROLES\`) or a missing privileged intent (e.g. \`GUILD_MEMBERS\` for \`listGuildMembers\`). Surface this to the user rather than retrying.

### Role permissions
\`permissions\` on \`createRole\` is a **bitwise integer encoded as a string** (Discord permissions exceed 32 bits). Example: \`"8"\` = Administrator. Combine permissions by OR-ing the bits in a language-level integer before stringifying.

### Webhooks vs bot messages
Use \`executeWebhook\` when you want to post with a custom username/avatar or into a channel where the bot isn't directly active. The \`webhook_token\` is returned by \`createWebhook\` and should be treated as a secret.
`,
	apiSetup: {
		baseUrl: 'https://discord.com/api/v10',
		headers: {
			Authorization: 'Bot {{ config.apiKey }}',
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'bearer',
			headers: {
				Authorization: 'Bot {{ config.apiKey }}',
			},
		},
	],
	scopes: {
		messages: 'Send, edit, delete and read messages in channels',
		guilds: 'Read and manage guilds (servers) and their channels',
		members: 'Read and manage guild members, bans, and kicks',
		webhooks: 'Create and execute webhooks',
		reactions: 'Add reactions to messages',
	},
	tools: [
		// ── Messages ─────────────────────────────────────────────────────────────

		{
			handle: 'sendMessage',
			description: 'Send a message to a Discord channel. Supports rich content such as embeds, components, attachments, and replies.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/channels/{{ input.channel_id }}/messages',
			body: {
				content: '{{ input.content }}',
				embeds: '{{ input.embeds }}',
				components: '{{ input.components }}',
				files: '{{ input.files }}',
				message_reference: '{{ input.message_reference }}',
				allowed_mentions: '{{ input.allowed_mentions }}',
				tts: '{{ input.tts }}',
			},
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel to send the message to'),
				content: z.string().optional().describe('The text content of the message (max 2000 characters)'),
				embeds: z.array(z.record(z.unknown())).optional().describe('Array of embed objects (max 10)'),
				components: z.array(z.record(z.unknown())).optional().describe('Array of message component objects (buttons, select menus, etc.)'),
				files: z.array(z.unknown()).optional().describe('Array of file attachments'),
				message_reference: z.record(z.unknown()).optional().describe('Message reference for replies — {message_id, channel_id?, guild_id?}'),
				allowed_mentions: z.record(z.unknown()).optional().describe('Allowed mentions object to control who gets notified'),
				tts: z.boolean().optional().describe('Whether the message should be read aloud using text-to-speech'),
			}),
		},

		{
			handle: 'editMessage',
			description: 'Edit a previously sent message in a channel. Can update content, embeds, and components.',
			scopes: ['messages'],
			method: 'PATCH',
			endpoint: '/channels/{{ input.channel_id }}/messages/{{ input.message_id }}',
			body: {
				content: '{{ input.content }}',
				embeds: '{{ input.embeds }}',
				components: '{{ input.components }}',
			},
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel containing the message'),
				message_id: z.string().describe('The ID of the message to edit'),
				content: z.string().optional().describe('New text content (max 2000 characters). Pass empty string to remove'),
				embeds: z.array(z.record(z.unknown())).optional().describe('New array of embed objects. Pass empty array to remove'),
				components: z.array(z.record(z.unknown())).optional().describe('New array of message components. Pass empty array to remove'),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Permanently delete a message from a channel. Requires MANAGE_MESSAGES permission for messages sent by others.',
			scopes: ['messages'],
			method: 'DELETE',
			endpoint: '/channels/{{ input.channel_id }}/messages/{{ input.message_id }}',
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel containing the message'),
				message_id: z.string().describe('The ID of the message to delete'),
			}),
		},

		{
			handle: 'getMessages',
			description: 'Retrieve messages from a channel. Supports pagination via before, after, and around parameters.',
			scopes: ['messages'],
			method: 'GET',
			endpoint: '/channels/{{ input.channel_id }}/messages',
			queryParams: {
				limit: '{{ input.limit }}',
				before: '{{ input.before }}',
				after: '{{ input.after }}',
				around: '{{ input.around }}',
			},
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel to retrieve messages from'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of messages to return (1–100, default 50)'),
				before: z.string().optional().describe('Get messages before this message ID'),
				after: z.string().optional().describe('Get messages after this message ID'),
				around: z.string().optional().describe('Get messages around this message ID (cannot be combined with before/after)'),
			}),
		},

		{
			handle: 'getMessage',
			description: 'Retrieve a specific message from a channel by its ID.',
			scopes: ['messages'],
			method: 'GET',
			endpoint: '/channels/{{ input.channel_id }}/messages/{{ input.message_id }}',
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel containing the message'),
				message_id: z.string().describe('The ID of the message to retrieve'),
			}),
		},

		// ── Guilds ───────────────────────────────────────────────────────────────

		{
			handle: 'listGuilds',
			description: 'Get a list of guilds (servers) that the current bot user is a member of.',
			scopes: ['guilds'],
			method: 'GET',
			endpoint: '/users/@me/guilds',
			queryParams: {
				limit: '{{ input.limit }}',
				before: '{{ input.before }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				limit: z.number().int().min(1).max(200).optional().describe('Max number of guilds to return (1–200, default 200)'),
				before: z.string().optional().describe('Get guilds with ID before this value'),
				after: z.string().optional().describe('Get guilds with ID after this value'),
			}),
		},

		{
			handle: 'getGuild',
			description: 'Retrieve a guild (server) by its ID. Optionally include approximate member and presence counts.',
			scopes: ['guilds'],
			method: 'GET',
			endpoint: '/guilds/{{ input.guild_id }}',
			queryParams: {
				with_counts: '{{ input.with_counts }}',
			},
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild to retrieve'),
				with_counts: z.boolean().optional().describe('Whether to include approximate member and presence counts'),
			}),
		},

		// ── Channels ─────────────────────────────────────────────────────────────

		{
			handle: 'listChannels',
			description: 'Get all channels in a guild, including text, voice, category, and thread channels.',
			scopes: ['guilds'],
			method: 'GET',
			endpoint: '/guilds/{{ input.guild_id }}/channels',
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild whose channels to list'),
			}),
		},

		{
			handle: 'createChannel',
			description: 'Create a new channel in a guild. Supports text, voice, announcement, forum, and category channel types.',
			scopes: ['guilds'],
			method: 'POST',
			endpoint: '/guilds/{{ input.guild_id }}/channels',
			body: {
				name: '{{ input.name }}',
				type: '{{ input.type }}',
				topic: '{{ input.topic }}',
				position: '{{ input.position }}',
				parent_id: '{{ input.parent_id }}',
				permission_overwrites: '{{ input.permission_overwrites }}',
			},
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild to create the channel in'),
				name: z.string().describe('Name of the channel (2–100 characters)'),
				type: z.number().int().optional().describe('Channel type: 0=text, 2=voice, 4=category, 5=announcement, 15=forum, 16=media'),
				topic: z.string().optional().describe('Channel topic (max 1024 characters for text; max 4096 for forum/media)'),
				position: z.number().int().optional().describe('Sorting position of the channel'),
				parent_id: z.string().optional().describe('ID of the parent category channel'),
				permission_overwrites: z.array(z.record(z.unknown())).optional().describe('Array of permission overwrite objects'),
			}),
		},

		{
			handle: 'deleteChannel',
			description: 'Delete a channel from a guild. For guilds, this requires MANAGE_CHANNELS permission.',
			scopes: ['guilds'],
			method: 'DELETE',
			endpoint: '/channels/{{ input.channel_id }}',
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel to delete'),
			}),
		},

		// ── Members ──────────────────────────────────────────────────────────────

		{
			handle: 'listGuildMembers',
			description: 'List members in a guild. Requires the GUILD_MEMBERS privileged intent to be enabled for the bot.',
			scopes: ['members'],
			method: 'GET',
			endpoint: '/guilds/{{ input.guild_id }}/members',
			queryParams: {
				limit: '{{ input.limit }}',
				after: '{{ input.after }}',
			},
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild to list members for'),
				limit: z.number().int().min(1).max(1000).optional().describe('Max number of members to return (1–1000, default 1)'),
				after: z.string().optional().describe('Return members after this user ID for pagination'),
			}),
		},

		{
			handle: 'getGuildMember',
			description: 'Get information about a specific member in a guild, including their roles and nickname.',
			scopes: ['members'],
			method: 'GET',
			endpoint: '/guilds/{{ input.guild_id }}/members/{{ input.user_id }}',
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild'),
				user_id: z.string().describe('The ID of the user to retrieve'),
			}),
		},

		{
			handle: 'kickMember',
			description: 'Remove a member from a guild. The user can rejoin via a new invite. Requires KICK_MEMBERS permission.',
			scopes: ['members'],
			method: 'DELETE',
			endpoint: '/guilds/{{ input.guild_id }}/members/{{ input.user_id }}',
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild'),
				user_id: z.string().describe('The ID of the user to kick'),
			}),
		},

		{
			handle: 'banMember',
			description: 'Ban a member from a guild, preventing them from rejoining. Optionally deletes their recent messages. Requires BAN_MEMBERS permission.',
			scopes: ['members'],
			method: 'PUT',
			endpoint: '/guilds/{{ input.guild_id }}/bans/{{ input.user_id }}',
			body: {
				delete_message_seconds: '{{ input.delete_message_seconds }}',
			},
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild'),
				user_id: z.string().describe('The ID of the user to ban'),
				delete_message_seconds: z.number().int().min(0).max(604800).optional().describe('Number of seconds worth of messages to delete (0–604800, i.e. 0–7 days)'),
			}),
		},

		// ── Roles ────────────────────────────────────────────────────────────────

		{
			handle: 'listRoles',
			description: 'Get all roles in a guild, including their permissions, color, and position.',
			scopes: ['guilds'],
			method: 'GET',
			endpoint: '/guilds/{{ input.guild_id }}/roles',
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild whose roles to list'),
			}),
		},

		{
			handle: 'createRole',
			description: 'Create a new role in a guild. Requires MANAGE_ROLES permission.',
			scopes: ['guilds'],
			method: 'POST',
			endpoint: '/guilds/{{ input.guild_id }}/roles',
			body: {
				name: '{{ input.name }}',
				permissions: '{{ input.permissions }}',
				color: '{{ input.color }}',
				hoist: '{{ input.hoist }}',
				mentionable: '{{ input.mentionable }}',
			},
			inputSchema: z.object({
				guild_id: z.string().describe('The ID of the guild to create the role in'),
				name: z.string().optional().describe('Name of the role (default: "new role")'),
				permissions: z.string().optional().describe('Bitwise permission integer as a string (e.g. "8" for administrator)'),
				color: z.number().int().min(0).max(0xFFFFFF).optional().describe('RGB color value as an integer (e.g. 0xFF0000 for red)'),
				hoist: z.boolean().optional().describe('Whether the role should be displayed separately in the sidebar'),
				mentionable: z.boolean().optional().describe('Whether the role can be mentioned by regular members'),
			}),
		},

		// ── Reactions ────────────────────────────────────────────────────────────

		{
			handle: 'addReaction',
			description: 'Add a reaction emoji to a message. Use Unicode emoji directly (e.g. "👍") or custom emoji in the format "name:id".',
			scopes: ['reactions'],
			method: 'PUT',
			endpoint: '/channels/{{ input.channel_id }}/messages/{{ input.message_id }}/reactions/{{ input.emoji }}/@me',
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel containing the message'),
				message_id: z.string().describe('The ID of the message to react to'),
				emoji: z.string().describe('The emoji to react with. Unicode emoji (e.g. "👍") or custom emoji as "name:id" (URL-encoded)'),
			}),
		},

		// ── Webhooks ─────────────────────────────────────────────────────────────

		{
			handle: 'createWebhook',
			description: 'Create a new webhook for a channel. Requires MANAGE_WEBHOOKS permission.',
			scopes: ['webhooks'],
			method: 'POST',
			endpoint: '/channels/{{ input.channel_id }}/webhooks',
			body: {
				name: '{{ input.name }}',
				avatar: '{{ input.avatar }}',
			},
			inputSchema: z.object({
				channel_id: z.string().describe('The ID of the channel to create the webhook for'),
				name: z.string().describe('Name of the webhook (1–80 characters)'),
				avatar: z.string().optional().describe('Base64-encoded image data URI for the webhook avatar (e.g. "data:image/png;base64,...")'),
			}),
		},

		{
			handle: 'executeWebhook',
			description: 'Send a message via a webhook. Supports custom usernames, avatars, embeds, and TTS.',
			scopes: ['webhooks'],
			method: 'POST',
			endpoint: '/webhooks/{{ input.webhook_id }}/{{ input.webhook_token }}',
			body: {
				content: '{{ input.content }}',
				username: '{{ input.username }}',
				avatar_url: '{{ input.avatar_url }}',
				embeds: '{{ input.embeds }}',
				tts: '{{ input.tts }}',
			},
			inputSchema: z.object({
				webhook_id: z.string().describe('The ID of the webhook'),
				webhook_token: z.string().describe('The token of the webhook'),
				content: z.string().optional().describe('Message text content (max 2000 characters)'),
				username: z.string().optional().describe('Override the default webhook username'),
				avatar_url: z.string().optional().describe('URL of an image to override the default webhook avatar'),
				embeds: z.array(z.record(z.unknown())).optional().describe('Array of embed objects to include (max 10)'),
				tts: z.boolean().optional().describe('Whether the message should be read aloud using text-to-speech'),
			}),
		},

		// ── Self ─────────────────────────────────────────────────────────────────

		{
			handle: 'getCurrentUser',
			description: 'Get information about the current bot user, including its username, discriminator, and ID.',
			scopes: ['guilds'],
			method: 'GET',
			endpoint: '/users/@me',
			inputSchema: z.object({}),
		},
	],
};
