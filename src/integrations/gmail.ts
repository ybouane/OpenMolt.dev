/**
 * @module integrations/gmail
 * Gmail API v1 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

// ─── Helper: base64url encode ─────────────────────────────────────────────────

function base64urlEncode(str: string): string {
	// Use Buffer in Node.js; fall back to btoa in browser environments
	if (typeof Buffer !== 'undefined') {
		return Buffer.from(str).toString('base64url');
	}
	return btoa(unescape(encodeURIComponent(str)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

// ─── Helper: build a simple RFC 2822 MIME message ────────────────────────────

function buildRfc2822Message(opts: {
	to: string;
	subject: string;
	body: string;
	from?: string;
	cc?: string;
	bcc?: string;
	replyTo?: string;
}): string {
	const lines: string[] = [];
	if (opts.from) lines.push(`From: ${opts.from}`);
	lines.push(`To: ${opts.to}`);
	if (opts.cc) lines.push(`Cc: ${opts.cc}`);
	if (opts.bcc) lines.push(`Bcc: ${opts.bcc}`);
	if (opts.replyTo) lines.push(`Reply-To: ${opts.replyTo}`);
	lines.push(`Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString('base64')}?=`);
	lines.push('MIME-Version: 1.0');
	lines.push('Content-Type: text/plain; charset=UTF-8');
	lines.push('Content-Transfer-Encoding: base64');
	lines.push('');
	lines.push(Buffer.from(opts.body).toString('base64'));
	return lines.join('\r\n');
}

// ─── Integration definition ───────────────────────────────────────────────────

export const gmailDefinition: IntegrationDefinition = {
	name: 'Gmail',
	apiSetup: {
		baseUrl: 'https://gmail.googleapis.com/gmail/v1',
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
				'https://www.googleapis.com/auth/gmail.readonly',
				'https://www.googleapis.com/auth/gmail.send',
				'https://www.googleapis.com/auth/gmail.compose',
				'https://www.googleapis.com/auth/gmail.modify',
				'https://mail.google.com/',
			],
		},
	],
	scopes: {
		read: 'Read messages, threads, and labels',
		write: 'Modify messages and manage labels',
		compose: 'Create drafts',
		labels: 'Create and manage labels',
		send: 'Send messages and drafts',
	},
	tools: [
		// ── Messages ──────────────────────────────────────────────────────────────

		{
			handle: 'listMessages',
			description: 'List messages in the user\'s mailbox matching optional query criteria. Returns message IDs and thread IDs; use getMessage to fetch full content.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/messages',
			queryParams: {
				q: '{{ input.q }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				labelIds: '{{ input.labelIds }}',
				includeSpamTrash: '{{ input.includeSpamTrash }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me" for the authenticated user'),
				q: z.string().optional().describe('Gmail search query, e.g. "from:alice@example.com is:unread after:2024/01/01"'),
				maxResults: z.number().int().min(1).max(500).optional().describe('Maximum number of messages to return (max 500, default 100)'),
				pageToken: z.string().optional().describe('Pagination token from a previous response'),
				labelIds: z.array(z.string()).optional().describe('Only return messages with labels matching all specified label IDs'),
				includeSpamTrash: z.boolean().optional().describe('Whether to include spam and trash messages (default false)'),
			}),
			outputSchema: z.object({
				messages: z.array(z.object({
					id: z.string(),
					threadId: z.string(),
				})).optional(),
				nextPageToken: z.string().optional(),
				resultSizeEstimate: z.number().optional(),
			}),
		},

		{
			handle: 'getMessage',
			description: 'Retrieve a full message by ID, including headers, body parts, and attachments. Use format "full" for complete content or "metadata" for headers only.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/messages/{{ input.id }}',
			queryParams: {
				format: '{{ input.format }}',
				metadataHeaders: '{{ input.metadataHeaders }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Message identifier'),
				format: z.enum(['minimal', 'full', 'raw', 'metadata']).optional().describe('The format to return the message in (default "full")'),
				metadataHeaders: z.array(z.string()).optional().describe('When format is "metadata", include only these headers'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()).optional(),
				snippet: z.string().optional(),
				payload: z.record(z.unknown()).optional(),
				internalDate: z.string().optional(),
				sizeEstimate: z.number().optional(),
			}),
		},

		{
			handle: 'sendMessage',
			description: 'Send an email message. The raw field must be a base64url-encoded RFC 2822 message. For a simpler interface, use sendSimpleMessage instead.',
			scopes: ['send'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/messages/send',
			body: {
				raw: '{{ input.raw }}',
				threadId: '{{ input.threadId }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				raw: z.string().describe('The entire email message in RFC 2822 format, encoded as base64url (no padding)'),
				threadId: z.string().optional().describe('Thread ID to reply to (adds the message to an existing thread)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()).optional(),
			}),
		},

		{
			handle: 'sendSimpleMessage',
			description: 'Send a plain-text email by providing human-readable fields. Automatically constructs the RFC 2822 MIME message and sends it. Simpler alternative to sendMessage.',
			scopes: ['send'],
			inputSchema: z.object({
				to: z.string().describe('Recipient email address(es), comma-separated'),
				subject: z.string().describe('Email subject line'),
				body: z.string().describe('Plain-text email body'),
				from: z.string().optional().describe('Sender address (must be an authorised send-as address; defaults to authenticated user)'),
				cc: z.string().optional().describe('CC recipients, comma-separated'),
				bcc: z.string().optional().describe('BCC recipients, comma-separated'),
				replyTo: z.string().optional().describe('Reply-To address'),
				threadId: z.string().optional().describe('Thread ID to reply to (adds the message to an existing thread)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()).optional(),
			}),
			execute: async (input: Record<string, unknown>, context: ToolContext) => {
				const accessToken = context.config?.accessToken as string | undefined;
				if (!accessToken) {
					throw new Error('No access token available in context.config.accessToken. Ensure the OAuth2 credential is configured with a valid access token.');
				}

				const mimeMessage = buildRfc2822Message({
					to: input.to as string,
					subject: input.subject as string,
					body: input.body as string,
					from: input.from as string | undefined,
					cc: input.cc as string | undefined,
					bcc: input.bcc as string | undefined,
					replyTo: input.replyTo as string | undefined,
				});

				const raw = base64urlEncode(mimeMessage);

				const requestBody: Record<string, unknown> = { raw };
				if (input.threadId) {
					requestBody.threadId = input.threadId;
				}

				const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${accessToken}`,
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(requestBody),
				});

				if (!response.ok) {
					const errText = await response.text();
					throw new Error(`Gmail send failed (${response.status}): ${errText.slice(0, 500)}`);
				}

				return response.json();
			},
		},

		// ── Drafts ────────────────────────────────────────────────────────────────

		{
			handle: 'listDrafts',
			description: 'List all drafts in the user\'s mailbox.',
			scopes: ['read', 'compose'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/drafts',
			queryParams: {
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				maxResults: z.number().int().min(1).max(500).optional().describe('Maximum number of drafts to return (max 500)'),
				pageToken: z.string().optional().describe('Pagination token from a previous response'),
			}),
			outputSchema: z.object({
				drafts: z.array(z.object({
					id: z.string(),
					message: z.object({
						id: z.string(),
						threadId: z.string(),
					}).optional(),
				})).optional(),
				nextPageToken: z.string().optional(),
				resultSizeEstimate: z.number().optional(),
			}),
		},

		{
			handle: 'createDraft',
			description: 'Create a new draft. The raw field must be a base64url-encoded RFC 2822 message.',
			scopes: ['compose'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/drafts',
			body: {
				message: {
					raw: '{{ input.raw }}',
				},
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				raw: z.string().describe('The entire email message in RFC 2822 format, encoded as base64url (no padding)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				message: z.object({
					id: z.string(),
					threadId: z.string(),
				}),
			}),
		},

		{
			handle: 'updateDraft',
			description: 'Replace the content of an existing draft with a new message.',
			scopes: ['compose'],
			method: 'PUT',
			endpoint: '/users/{{ input.userId }}/drafts/{{ input.id }}',
			body: {
				message: {
					raw: '{{ input.raw }}',
				},
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Draft identifier to update'),
				raw: z.string().describe('Updated message in RFC 2822 format, base64url-encoded'),
			}),
			outputSchema: z.object({
				id: z.string(),
				message: z.object({
					id: z.string(),
					threadId: z.string(),
				}),
			}),
		},

		{
			handle: 'sendDraft',
			description: 'Send an existing draft immediately.',
			scopes: ['send'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/drafts/send',
			body: {
				id: '{{ input.id }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Draft identifier to send'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()).optional(),
			}),
		},

		{
			handle: 'deleteDraft',
			description: 'Permanently delete a draft.',
			scopes: ['compose'],
			method: 'DELETE',
			endpoint: '/users/{{ input.userId }}/drafts/{{ input.id }}',
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Draft identifier to delete'),
			}),
			outputSchema: z.object({}),
		},

		// ── Labels ────────────────────────────────────────────────────────────────

		{
			handle: 'listLabels',
			description: 'List all labels in the user\'s mailbox, including system labels (INBOX, SENT, etc.) and user-created labels.',
			scopes: ['labels'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/labels',
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
			}),
			outputSchema: z.object({
				labels: z.array(z.object({
					id: z.string(),
					name: z.string(),
					type: z.enum(['system', 'user']),
					messageListVisibility: z.string().optional(),
					labelListVisibility: z.string().optional(),
				})),
			}),
		},

		{
			handle: 'createLabel',
			description: 'Create a new user label.',
			scopes: ['labels'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/labels',
			body: {
				name: '{{ input.name }}',
				labelListVisibility: '{{ input.labelListVisibility }}',
				messageListVisibility: '{{ input.messageListVisibility }}',
				color: '{{ input.color }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				name: z.string().describe('Label display name'),
				labelListVisibility: z.enum(['labelShow', 'labelShowIfUnread', 'labelHide']).optional().describe('Visibility of the label in the label list (sidebar)'),
				messageListVisibility: z.enum(['show', 'hide']).optional().describe('Visibility of messages with this label in the message list'),
				color: z.object({
					textColor: z.string().optional().describe('Text color as hex string, e.g. "#000000"'),
					backgroundColor: z.string().optional().describe('Background color as hex string, e.g. "#4a86e8"'),
				}).optional().describe('Label color configuration'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				type: z.literal('user'),
			}),
		},

		// ── Message mutations ─────────────────────────────────────────────────────

		{
			handle: 'modifyMessage',
			description: 'Add or remove labels on a message (e.g. mark as read by removing UNREAD, star by adding STARRED).',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/messages/{{ input.id }}/modify',
			body: {
				addLabelIds: '{{ input.addLabelIds }}',
				removeLabelIds: '{{ input.removeLabelIds }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Message identifier'),
				addLabelIds: z.array(z.string()).optional().describe('List of label IDs to add to the message (e.g. ["STARRED", "IMPORTANT"])'),
				removeLabelIds: z.array(z.string()).optional().describe('List of label IDs to remove from the message (e.g. ["UNREAD"])'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()),
			}),
		},

		{
			handle: 'trashMessage',
			description: 'Move a message to the trash. The message can be recovered from trash within 30 days.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/users/{{ input.userId }}/messages/{{ input.id }}/trash',
			body: {},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Message identifier to trash'),
			}),
			outputSchema: z.object({
				id: z.string(),
				threadId: z.string(),
				labelIds: z.array(z.string()),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Permanently delete a message. This bypasses trash and cannot be undone.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/users/{{ input.userId }}/messages/{{ input.id }}',
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Message identifier to permanently delete'),
			}),
			outputSchema: z.object({}),
		},

		// ── Threads ───────────────────────────────────────────────────────────────

		{
			handle: 'listThreads',
			description: 'List threads in the user\'s mailbox. Each thread groups related messages by conversation.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/threads',
			queryParams: {
				q: '{{ input.q }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				labelIds: '{{ input.labelIds }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				q: z.string().optional().describe('Gmail search query to filter threads'),
				maxResults: z.number().int().min(1).max(500).optional().describe('Maximum number of threads to return (max 500, default 100)'),
				pageToken: z.string().optional().describe('Pagination token from a previous response'),
				labelIds: z.array(z.string()).optional().describe('Only return threads with all of the specified label IDs'),
			}),
			outputSchema: z.object({
				threads: z.array(z.object({
					id: z.string(),
					snippet: z.string().optional(),
					historyId: z.string().optional(),
				})).optional(),
				nextPageToken: z.string().optional(),
				resultSizeEstimate: z.number().optional(),
			}),
		},

		{
			handle: 'getThread',
			description: 'Retrieve all messages in a thread.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/threads/{{ input.id }}',
			queryParams: {
				format: '{{ input.format }}',
			},
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
				id: z.string().describe('Thread identifier'),
				format: z.enum(['minimal', 'full', 'metadata']).optional().describe('The format to return messages in (default "full")'),
			}),
			outputSchema: z.object({
				id: z.string(),
				snippet: z.string().optional(),
				historyId: z.string().optional(),
				messages: z.array(z.record(z.unknown())),
			}),
		},

		// ── Profile ───────────────────────────────────────────────────────────────

		{
			handle: 'getProfile',
			description: 'Get the authenticated user\'s Gmail profile, including email address, message count, and thread count.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/{{ input.userId }}/profile',
			inputSchema: z.object({
				userId: z.string().default('me').describe('The user\'s email address or "me"'),
			}),
			outputSchema: z.object({
				emailAddress: z.string(),
				messagesTotal: z.number(),
				threadsTotal: z.number(),
				historyId: z.string(),
			}),
		},
	],
};
