/**
 * @module integrations/telegram
 * Telegram Bot API integration definition.
 * The bot token is embedded in the base URL path as per the Telegram API design.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const telegramDefinition: IntegrationDefinition = {
	name: 'Telegram',
	instructions: `
### Bot Setup
- Create a bot via **@BotFather** on Telegram to get a token (format \`123456:ABC-DEF...\`). This is the \`apiKey\`. The token is embedded in the URL — there is no Authorization header.
- The bot can only message users who have **started a conversation** with it (sent \`/start\`). For groups, add the bot as a member first.

### Chat Identifiers
- \`chat_id\` accepts either a **numeric ID** (e.g. \`123456789\` for users, negative like \`-1001234567890\` for supergroups/channels) or a **@username** string for public channels (e.g. \`@mychannel\`).
- To discover numeric IDs, call \`getUpdates\` (if no webhook is set) or have the user message \`@userinfobot\`.

### Parse Modes (Formatting)
- \`MarkdownV2\` is the recommended mode but requires **escaping** of \`_ * [ ] ( ) ~ \\\` > # + - = | { } . !\` with a backslash. \`HTML\` is often simpler for programmatic output (\`<b>\`, \`<i>\`, \`<code>\`, \`<a href="">\`). Legacy \`Markdown\` is simpler but limited.

### Reply Markup (Keyboards)
- \`reply_markup\` is an object. For inline buttons: \`{ inline_keyboard: [[ { text: 'Click', url: 'https://...' }, { text: 'Action', callback_data: 'do_x' } ]] }\` (array of rows of buttons). For a custom keyboard: \`{ keyboard: [[ 'Yes', 'No' ]], resize_keyboard: true, one_time_keyboard: true }\`. Remove with \`{ remove_keyboard: true }\`.

### Media
- \`photo\`, \`document\`, \`video\`, etc. accept either an HTTPS URL Telegram will download, or a \`file_id\` from a previously-sent file (reuse is free and instant). Direct file uploads require multipart (not supported by this integration — upload to a URL first).
- Caption max: photos/videos 1024 chars, text messages 4096 chars. Split long text across multiple sends.

### Webhooks vs Polling
- A bot uses **either** webhooks (set via \`setWebhook\`) **or** long polling (\`getUpdates\`) — not both. Calling \`getUpdates\` while a webhook is active will fail.
- Webhook URL must be HTTPS with a valid cert. Use \`deleteWebhook\` to switch back to polling.

### Response Envelope
- Every response is wrapped: \`{ ok: true, result: ... }\` on success, \`{ ok: false, error_code, description }\` on failure. Check \`ok\` before using \`result\`.

### Rate Limits
- ~30 messages/sec globally, 1 msg/sec per chat, 20 msgs/min per group. Burst above these and Telegram returns \`429\` with a \`retry_after\` hint.
`,
	apiSetup: {
		baseUrl: 'https://api.telegram.org/bot{{ config.apiKey }}',
		headers: {
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'custom',
			// Telegram auth is token-in-URL; no Authorization header needed.
			// The apiKey is embedded in the baseUrl via Liquid template.
		},
	],
	scopes: {
		messages: 'Send, edit, delete, forward, and copy messages',
		chat: 'Manage chat members, pins, bans, and retrieve chat information',
		webhooks: 'Set, delete, and inspect webhook configuration',
	},
	tools: [
		// ── Sending Messages ─────────────────────────────────────────────────────

		{
			handle: 'sendMessage',
			description: 'Send a text message to a chat. Supports Markdown/HTML formatting, reply markup keyboards, and silent delivery.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				text: '{{ input.text }}',
				parse_mode: '{{ input.parse_mode }}',
				reply_to_message_id: '{{ input.reply_to_message_id }}',
				disable_notification: '{{ input.disable_notification }}',
				protect_content: '{{ input.protect_content }}',
				reply_markup: '{{ input.reply_markup }}',
				entities: '{{ input.entities }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Unique identifier for the target chat or username of the target channel (e.g. @channelusername)'),
				text: z.string().max(4096).describe('Text of the message to send (max 4096 characters)'),
				parse_mode: z.enum(['Markdown', 'MarkdownV2', 'HTML']).optional().describe('Formatting mode for the message text'),
				reply_to_message_id: z.number().int().optional().describe('If specified, the message will be a reply to the message with this ID'),
				disable_notification: z.boolean().optional().describe('Send the message silently (no notification sound for the recipient)'),
				protect_content: z.boolean().optional().describe('Protect the message content from being forwarded or saved'),
				reply_markup: z.record(z.unknown()).optional().describe('Reply keyboard or inline keyboard markup object'),
				entities: z.array(z.record(z.unknown())).optional().describe('Array of MessageEntity objects for special entities in the text'),
			}),
		},

		{
			handle: 'sendPhoto',
			description: 'Send a photo to a chat. The photo can be specified as a file ID of an already-uploaded file or as a URL.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendPhoto',
			body: {
				chat_id: '{{ input.chat_id }}',
				photo: '{{ input.photo }}',
				caption: '{{ input.caption }}',
				parse_mode: '{{ input.parse_mode }}',
				reply_to_message_id: '{{ input.reply_to_message_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				photo: z.string().describe('Photo file_id or HTTPS URL to send'),
				caption: z.string().max(1024).optional().describe('Photo caption (max 1024 characters)'),
				parse_mode: z.string().optional().describe('Formatting mode for the caption'),
				reply_to_message_id: z.number().int().optional().describe('ID of the original message to reply to'),
			}),
		},

		{
			handle: 'sendDocument',
			description: 'Send a general file (document) to a chat. Use file_id or a URL to an existing file.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendDocument',
			body: {
				chat_id: '{{ input.chat_id }}',
				document: '{{ input.document }}',
				caption: '{{ input.caption }}',
				parse_mode: '{{ input.parse_mode }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				document: z.string().describe('Document file_id or HTTPS URL to send'),
				caption: z.string().max(1024).optional().describe('Document caption (max 1024 characters)'),
				parse_mode: z.string().optional().describe('Formatting mode for the caption'),
			}),
		},

		{
			handle: 'sendVideo',
			description: 'Send a video to a chat. Telegram clients support mp4 videos. Use file_id or a URL.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendVideo',
			body: {
				chat_id: '{{ input.chat_id }}',
				video: '{{ input.video }}',
				caption: '{{ input.caption }}',
				duration: '{{ input.duration }}',
				width: '{{ input.width }}',
				height: '{{ input.height }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				video: z.string().describe('Video file_id or HTTPS URL to send'),
				caption: z.string().max(1024).optional().describe('Video caption (max 1024 characters)'),
				duration: z.number().int().optional().describe('Duration of the video in seconds'),
				width: z.number().int().optional().describe('Video width in pixels'),
				height: z.number().int().optional().describe('Video height in pixels'),
			}),
		},

		{
			handle: 'sendAudio',
			description: 'Send an audio file to a chat. Telegram clients will display it in the music player. Use file_id or a URL.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendAudio',
			body: {
				chat_id: '{{ input.chat_id }}',
				audio: '{{ input.audio }}',
				caption: '{{ input.caption }}',
				duration: '{{ input.duration }}',
				title: '{{ input.title }}',
				performer: '{{ input.performer }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				audio: z.string().describe('Audio file_id or HTTPS URL to send'),
				caption: z.string().max(1024).optional().describe('Audio caption (max 1024 characters)'),
				duration: z.number().int().optional().describe('Duration of the audio in seconds'),
				title: z.string().optional().describe('Track title'),
				performer: z.string().optional().describe('Performer / artist name'),
			}),
		},

		{
			handle: 'sendLocation',
			description: 'Send a geographic location point to a chat. Can optionally be a live location that updates over time.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendLocation',
			body: {
				chat_id: '{{ input.chat_id }}',
				latitude: '{{ input.latitude }}',
				longitude: '{{ input.longitude }}',
				horizontal_accuracy: '{{ input.horizontal_accuracy }}',
				live_period: '{{ input.live_period }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				latitude: z.number().describe('Latitude of the location in decimal degrees'),
				longitude: z.number().describe('Longitude of the location in decimal degrees'),
				horizontal_accuracy: z.number().min(0).max(1500).optional().describe('Accuracy radius of the location in meters (0–1500)'),
				live_period: z.number().int().min(60).max(86400).optional().describe('For live locations: period in seconds the location will be updated (60–86400)'),
			}),
		},

		{
			handle: 'sendContact',
			description: 'Send a phone contact to a chat.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendContact',
			body: {
				chat_id: '{{ input.chat_id }}',
				phone_number: '{{ input.phone_number }}',
				first_name: '{{ input.first_name }}',
				last_name: '{{ input.last_name }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				phone_number: z.string().describe('Contact\'s phone number'),
				first_name: z.string().describe('Contact\'s first name'),
				last_name: z.string().optional().describe('Contact\'s last name'),
			}),
		},

		{
			handle: 'sendPoll',
			description: 'Send a native Telegram poll to a chat. Supports regular polls and quiz polls.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendPoll',
			body: {
				chat_id: '{{ input.chat_id }}',
				question: '{{ input.question }}',
				options: '{{ input.options }}',
				is_anonymous: '{{ input.is_anonymous }}',
				type: '{{ input.type }}',
				allows_multiple_answers: '{{ input.allows_multiple_answers }}',
				correct_option_id: '{{ input.correct_option_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				question: z.string().max(300).describe('Poll question (max 300 characters)'),
				options: z.array(z.string()).min(2).max(10).describe('Array of answer options (2–10 strings, each max 100 chars)'),
				is_anonymous: z.boolean().optional().describe('Whether the poll is anonymous (default true)'),
				type: z.enum(['regular', 'quiz']).optional().describe('Poll type: regular (multiple choice) or quiz (single correct answer)'),
				allows_multiple_answers: z.boolean().optional().describe('Whether users can select multiple answers (only for regular polls)'),
				correct_option_id: z.number().int().min(0).optional().describe('0-based ID of the correct answer (required for quiz polls)'),
			}),
		},

		// ── Forwarding & Copying ──────────────────────────────────────────────────

		{
			handle: 'forwardMessage',
			description: 'Forward a message from one chat to another, including the original sender attribution.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/forwardMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				from_chat_id: '{{ input.from_chat_id }}',
				message_id: '{{ input.message_id }}',
				disable_notification: '{{ input.disable_notification }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username to forward to'),
				from_chat_id: z.union([z.string(), z.number()]).describe('Source chat ID or channel username to forward from'),
				message_id: z.number().int().describe('ID of the message to forward'),
				disable_notification: z.boolean().optional().describe('Send the forwarded message silently'),
			}),
		},

		{
			handle: 'copyMessage',
			description: 'Copy a message to another chat without the forward attribution link. Optionally add a new caption.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/copyMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				from_chat_id: '{{ input.from_chat_id }}',
				message_id: '{{ input.message_id }}',
				caption: '{{ input.caption }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username to copy to'),
				from_chat_id: z.union([z.string(), z.number()]).describe('Source chat ID or channel username to copy from'),
				message_id: z.number().int().describe('ID of the message to copy'),
				caption: z.string().max(1024).optional().describe('New caption for the copied message'),
			}),
		},

		// ── Editing & Deleting ────────────────────────────────────────────────────

		{
			handle: 'editMessageText',
			description: 'Edit the text of a previously sent message. Works for both regular and inline messages.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/editMessageText',
			body: {
				chat_id: '{{ input.chat_id }}',
				message_id: '{{ input.message_id }}',
				inline_message_id: '{{ input.inline_message_id }}',
				text: '{{ input.text }}',
				parse_mode: '{{ input.parse_mode }}',
				reply_markup: '{{ input.reply_markup }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).optional().describe('Required for non-inline messages: chat ID or channel username'),
				message_id: z.number().int().optional().describe('Required for non-inline messages: ID of the message to edit'),
				inline_message_id: z.string().optional().describe('Required for inline messages: ID of the inline message to edit'),
				text: z.string().max(4096).describe('New text of the message (max 4096 characters)'),
				parse_mode: z.string().optional().describe('Formatting mode for the new text'),
				reply_markup: z.record(z.unknown()).optional().describe('New inline keyboard markup'),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Delete a message. A bot can only delete its own messages or messages in groups where it is an admin.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/deleteMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				message_id: '{{ input.message_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Chat ID or channel username containing the message'),
				message_id: z.number().int().describe('ID of the message to delete'),
			}),
		},

		// ── Updates & Webhooks ────────────────────────────────────────────────────

		{
			handle: 'getUpdates',
			description: 'Get incoming updates using long polling. Each call returns up to `limit` pending updates. Use offset to confirm processed updates.',
			scopes: ['webhooks'],
			method: 'GET',
			endpoint: '/getUpdates',
			queryParams: {
				offset: '{{ input.offset }}',
				limit: '{{ input.limit }}',
				timeout: '{{ input.timeout }}',
				allowed_updates: '{{ input.allowed_updates }}',
			},
			inputSchema: z.object({
				offset: z.number().int().optional().describe('Identifier of the first update to be returned (confirms previous updates)'),
				limit: z.number().int().min(1).max(100).optional().describe('Number of updates to retrieve (1–100, default 100)'),
				timeout: z.number().int().min(0).optional().describe('Timeout in seconds for long polling (0 = short poll)'),
				allowed_updates: z.array(z.string()).optional().describe('List of update types to receive (e.g. ["message", "callback_query"])'),
			}),
		},

		{
			handle: 'setWebhook',
			description: 'Set a URL to receive incoming updates via an outgoing webhook. Removes long-polling when set.',
			scopes: ['webhooks'],
			method: 'POST',
			endpoint: '/setWebhook',
			body: {
				url: '{{ input.url }}',
				max_connections: '{{ input.max_connections }}',
				allowed_updates: '{{ input.allowed_updates }}',
				secret_token: '{{ input.secret_token }}',
			},
			inputSchema: z.object({
				url: z.string().url().describe('HTTPS URL to send updates to. Use empty string to remove webhook'),
				max_connections: z.number().int().min(1).max(100).optional().describe('Maximum allowed concurrent HTTPS connections to the webhook (1–100, default 40)'),
				allowed_updates: z.array(z.string()).optional().describe('List of update types to receive. Pass empty array to reset to defaults'),
				secret_token: z.string().optional().describe('Secret token sent in X-Telegram-Bot-Api-Secret-Token header for verification (1–256 chars)'),
			}),
		},

		{
			handle: 'deleteWebhook',
			description: 'Remove the currently set webhook and switch back to long polling.',
			scopes: ['webhooks'],
			method: 'POST',
			endpoint: '/deleteWebhook',
			body: {
				drop_pending_updates: '{{ input.drop_pending_updates }}',
			},
			inputSchema: z.object({
				drop_pending_updates: z.boolean().optional().describe('Pass true to drop all pending updates upon webhook removal'),
			}),
		},

		{
			handle: 'getWebhookInfo',
			description: 'Get current webhook status, including URL, pending update count, and any recent errors.',
			scopes: ['webhooks'],
			method: 'GET',
			endpoint: '/getWebhookInfo',
			inputSchema: z.object({}),
		},

		// ── Chat Management ───────────────────────────────────────────────────────

		{
			handle: 'getChat',
			description: 'Get up-to-date information about a chat including its title, type, description, and pinned message.',
			scopes: ['chat'],
			method: 'GET',
			endpoint: '/getChat',
			queryParams: {
				chat_id: '{{ input.chat_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Unique identifier for the target chat or username of the target channel'),
			}),
		},

		{
			handle: 'getChatMembers',
			description: 'Get the number of members in a chat.',
			scopes: ['chat'],
			method: 'GET',
			endpoint: '/getChatMemberCount',
			queryParams: {
				chat_id: '{{ input.chat_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Unique identifier for the target chat or channel username'),
			}),
		},

		{
			handle: 'banChatMember',
			description: 'Ban a user from a group, supergroup, or channel. The bot must be an administrator with the appropriate admin rights.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/banChatMember',
			body: {
				chat_id: '{{ input.chat_id }}',
				user_id: '{{ input.user_id }}',
				until_date: '{{ input.until_date }}',
				revoke_messages: '{{ input.revoke_messages }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Chat ID or channel username'),
				user_id: z.number().int().describe('Unique identifier of the user to ban'),
				until_date: z.number().int().optional().describe('Unix timestamp when the ban will be lifted (0 or not set = permanent ban)'),
				revoke_messages: z.boolean().optional().describe('Pass true to delete all messages from the banned user'),
			}),
		},

		{
			handle: 'unbanChatMember',
			description: 'Unban a previously banned user from a supergroup or channel. The user will be able to rejoin via an invite link.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/unbanChatMember',
			body: {
				chat_id: '{{ input.chat_id }}',
				user_id: '{{ input.user_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Chat ID or channel username'),
				user_id: z.number().int().describe('Unique identifier of the user to unban'),
			}),
		},

		{
			handle: 'pinChatMessage',
			description: 'Pin a message in a group, supergroup, or channel. The bot must be an administrator.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/pinChatMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				message_id: '{{ input.message_id }}',
				disable_notification: '{{ input.disable_notification }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Chat ID or channel username'),
				message_id: z.number().int().describe('ID of the message to pin'),
				disable_notification: z.boolean().optional().describe('Pass true to pin silently (no notification for channel members)'),
			}),
		},

		{
			handle: 'unpinChatMessage',
			description: 'Unpin a pinned message in a group, supergroup, or channel. If message_id is omitted, the most recent pinned message is unpinned.',
			scopes: ['chat'],
			method: 'POST',
			endpoint: '/unpinChatMessage',
			body: {
				chat_id: '{{ input.chat_id }}',
				message_id: '{{ input.message_id }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Chat ID or channel username'),
				message_id: z.number().int().optional().describe('ID of the specific message to unpin. Omit to unpin the most recently pinned message'),
			}),
		},

		// ── Callbacks ─────────────────────────────────────────────────────────────

		{
			handle: 'answerCallbackQuery',
			description: 'Answer a callback query from an inline keyboard button press. Must be called within 10 seconds of receiving the query.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/answerCallbackQuery',
			body: {
				callback_query_id: '{{ input.callback_query_id }}',
				text: '{{ input.text }}',
				show_alert: '{{ input.show_alert }}',
				url: '{{ input.url }}',
				cache_time: '{{ input.cache_time }}',
			},
			inputSchema: z.object({
				callback_query_id: z.string().describe('Unique identifier for the callback query to answer'),
				text: z.string().max(200).optional().describe('Text of the notification to show the user (max 200 characters)'),
				show_alert: z.boolean().optional().describe('If true, an alert is shown instead of a notification at the top of the chat'),
				url: z.string().optional().describe('URL to open (for game bots)'),
				cache_time: z.number().int().min(0).optional().describe('Max time in seconds that the result may be cached client-side (default 0)'),
			}),
		},

		// ── Bot Info ──────────────────────────────────────────────────────────────

		{
			handle: 'getMe',
			description: 'Get basic information about the bot: username, first name, ID, and capability flags.',
			scopes: ['chat'],
			method: 'GET',
			endpoint: '/getMe',
			inputSchema: z.object({}),
		},

		{
			handle: 'sendChatAction',
			description: 'Send a chat action indicator (e.g. "typing...") to show the bot is preparing a response. The action disappears after 5 seconds or on next message.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/sendChatAction',
			body: {
				chat_id: '{{ input.chat_id }}',
				action: '{{ input.action }}',
			},
			inputSchema: z.object({
				chat_id: z.union([z.string(), z.number()]).describe('Target chat ID or channel username'),
				action: z.string().describe('Type of action: "typing", "upload_photo", "upload_video", "upload_document", "find_location", etc.'),
			}),
		},
	],
};
