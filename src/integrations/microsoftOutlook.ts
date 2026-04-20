import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const microsoftOutlookDefinition: IntegrationDefinition = {
	name: 'Microsoft Outlook',
	instructions: `
### Graph API, not EWS
This integration calls **Microsoft Graph** (\`/me/...\`). All IDs are opaque Graph item IDs (long base64-like strings). Do not compare, parse, or construct them.

### OData query options
Outlook list endpoints take standard OData modifiers — pass them with their literal names in the input (\`$filter\`, \`$top\`, \`$skip\`, \`$orderby\`, \`$select\`, \`$search\`):
- \`$filter\`: \`"isRead eq false and importance eq 'high'"\`, \`"receivedDateTime ge 2026-04-01T00:00:00Z"\`, \`"from/emailAddress/address eq 'alice@example.com'"\`.
- \`$orderby\`: \`"receivedDateTime desc"\`.
- \`$select\`: limit payload, e.g. \`"subject,from,receivedDateTime"\`.
- \`$search\`: **free-text search** (\`"project kickoff"\`). Note: \`$search\` and \`$filter\` cannot be combined on message endpoints.

Strings in \`$filter\` use single quotes; escape with doubling (\`''\`). Dates are ISO 8601 UTC.

### Sending email
\`sendMessage\` uses Graph's nested shape. Each recipient is \`{ "emailAddress": { "address": "a@b.com", "name": "..." } }\` — not a bare string. \`body.contentType\` is \`"Text"\` or \`"HTML"\` (case-sensitive).

### Replies & forwards
\`replyToMessage\` and \`forwardMessage\` take a Graph message \`id\` plus a \`comment\` that is **prepended** to the original body — the original content is included automatically by the server. Do not reconstruct the quoted content yourself.

### Folders
\`listFolders\` returns mail folders; use well-known names directly when appropriate: \`inbox\`, \`sentitems\`, \`drafts\`, \`deleteditems\`, \`junkemail\`, \`archive\`. \`moveMessage\` accepts either a folder ID or one of those names as \`destinationId\`.

### Calendar events
- \`start\` / \`end\` are \`{ dateTime: "2026-04-20T14:30:00", timeZone: "Pacific Standard Time" }\`. Graph uses **Windows timezone names** (\`Pacific Standard Time\`, \`Eastern Standard Time\`, …) by default; pass IANA names only if you also send the \`Prefer: outlook.timezone\` header (not exposed here).
- All-day events: set \`isAllDay: true\` and use date-only \`dateTime\` values (\`2026-04-20T00:00:00\`) with \`end.dateTime\` **exclusive** (next day).
- Attendees: \`{ emailAddress: { address, name }, type: "required" | "optional" }\`.
- \`getCalendarView\` returns expanded recurring events between \`startDateTime\` / \`endDateTime\` — prefer this over \`listCalendarEvents\` when working with repeating events.

### Pagination
Responses include \`@odata.nextLink\` when more data exists. This integration exposes \`$top\` / \`$skip\`; prefer \`$top: 50\`-ish and iterate \`$skip\` rather than page through the link.

### Read/unread, deletes
- \`deleteMessage\` moves to \`deleteditems\` (Outlook's Trash), not permanent — can be recovered from there.
- To mark read, PATCH the message with \`isRead: true\` — not exposed as a dedicated tool here, use \`httpRequest\` if needed.
`,
	apiSetup: {
		baseUrl: 'https://graph.microsoft.com/v1.0',
		headers: {
			'Content-Type': 'application/json',
		},
		requestFormat: 'json',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'oauth2',
			authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
			tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
			clientId: '{{ config.clientId }}',
			clientSecret: '{{ config.clientSecret }}',
			refreshToken: '{{ config.refreshToken }}',
			scopes: [
				'Mail.Read',
				'Mail.ReadWrite',
				'Mail.Send',
				'Calendars.Read',
				'Calendars.ReadWrite',
				'Contacts.Read',
				'Contacts.ReadWrite',
				'User.Read',
			],
		},
	],
	scopes: {
		'mail.read': 'Read email messages and folders',
		'mail.write': 'Create, update, and delete email messages',
		'calendar.read': 'Read calendar events',
		'calendar.write': 'Create, update, and delete calendar events',
		'contacts.read': 'Read contacts',
		'contacts.write': 'Create, update, and delete contacts',
	},
	tools: [
		{
			handle: 'listMessages',
			description: 'List email messages from the user\'s mailbox',
			scopes: ['mail.read'],
			method: 'GET',
			endpoint: '/me/messages',
			queryParams: {
				'$filter': '{{ input.$filter }}',
				'$top': '{{ input.$top }}',
				'$skip': '{{ input.$skip }}',
				'$orderby': '{{ input.$orderby }}',
				'$select': '{{ input.$select }}',
				'$search': '{{ input.$search }}',
			},
			inputSchema: z.object({
				$filter: z.string().optional().describe('OData filter expression'),
				$top: z.number().int().min(1).max(1000).optional().describe('Maximum number of messages to return'),
				$skip: z.number().int().min(0).optional().describe('Number of messages to skip'),
				$orderby: z.string().optional().describe('OData orderby expression'),
				$select: z.string().optional().describe('Comma-separated list of properties to include'),
				$search: z.string().optional().describe('Search query string'),
			}),
			outputSchema: z.object({
				'@odata.nextLink': z.string().optional(),
				value: z.array(z.object({
					id: z.string(),
					subject: z.string().optional(),
					from: z.object({
						emailAddress: z.object({ name: z.string().optional(), address: z.string() }),
					}).optional(),
					receivedDateTime: z.string().optional(),
					bodyPreview: z.string().optional(),
					isRead: z.boolean().optional(),
					hasAttachments: z.boolean().optional(),
				})),
			}),
		},
		{
			handle: 'getMessage',
			description: 'Get a specific email message by its ID',
			scopes: ['mail.read'],
			method: 'GET',
			endpoint: '/me/messages/{{ input.id }}',
			queryParams: {
				'$select': '{{ input.$select }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the message to retrieve'),
				$select: z.string().optional().describe('Comma-separated list of properties to include'),
			}),
			outputSchema: z.object({
				id: z.string(),
				subject: z.string().optional(),
				body: z.object({
					contentType: z.string(),
					content: z.string(),
				}).optional(),
				from: z.object({
					emailAddress: z.object({ name: z.string().optional(), address: z.string() }),
				}).optional(),
				toRecipients: z.array(z.object({
					emailAddress: z.object({ name: z.string().optional(), address: z.string() }),
				})).optional(),
				receivedDateTime: z.string().optional(),
				isRead: z.boolean().optional(),
				hasAttachments: z.boolean().optional(),
			}),
		},
		{
			handle: 'sendMessage',
			description: 'Send an email message',
			scopes: ['mail.write'],
			method: 'POST',
			endpoint: '/me/sendMail',
			body: {
				message: {
					subject: '{{ input.subject }}',
					body: {
						contentType: '{{ input.body.contentType }}',
						content: '{{ input.body.content }}',
					},
					toRecipients: '{{ input.toRecipients }}',
					ccRecipients: '{{ input.ccRecipients }}',
					bccRecipients: '{{ input.bccRecipients }}',
					importance: '{{ input.importance }}',
				},
				saveToSentItems: '{{ input.saveToSentItems }}',
			},
			inputSchema: z.object({
				subject: z.string().describe('Subject of the email'),
				body: z.object({
					contentType: z.enum(['Text', 'HTML']).describe('Format of the body content'),
					content: z.string().describe('Body content of the email'),
				}).describe('Body of the email'),
				toRecipients: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
				})).describe('List of primary recipients'),
				ccRecipients: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
				})).optional().describe('List of CC recipients'),
				bccRecipients: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
				})).optional().describe('List of BCC recipients'),
				importance: z.enum(['low', 'normal', 'high']).optional().describe('Importance level of the message'),
				saveToSentItems: z.boolean().optional().default(true).describe('Whether to save the message to Sent Items'),
			}),
		},
		{
			handle: 'replyToMessage',
			description: 'Reply to an email message',
			scopes: ['mail.write'],
			method: 'POST',
			endpoint: '/me/messages/{{ input.id }}/reply',
			body: {
				comment: '{{ input.comment }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the message to reply to'),
				comment: z.string().describe('The comment to include in the reply'),
			}),
		},
		{
			handle: 'forwardMessage',
			description: 'Forward an email message to other recipients',
			scopes: ['mail.write'],
			method: 'POST',
			endpoint: '/me/messages/{{ input.id }}/forward',
			body: {
				comment: '{{ input.comment }}',
				toRecipients: '{{ input.toRecipients }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the message to forward'),
				comment: z.string().optional().describe('Optional comment to include when forwarding'),
				toRecipients: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
				})).describe('Recipients to forward the message to'),
			}),
		},
		{
			handle: 'deleteMessage',
			description: 'Delete an email message',
			scopes: ['mail.write'],
			method: 'DELETE',
			endpoint: '/me/messages/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The ID of the message to delete'),
			}),
		},
		{
			handle: 'moveMessage',
			description: 'Move an email message to a different mail folder',
			scopes: ['mail.write'],
			method: 'POST',
			endpoint: '/me/messages/{{ input.id }}/move',
			body: {
				destinationId: '{{ input.destinationId }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the message to move'),
				destinationId: z.string().describe('The ID of the destination folder (or well-known name: inbox, drafts, sentItems, deleteditems)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				subject: z.string().optional(),
				parentFolderId: z.string().optional(),
			}),
		},
		{
			handle: 'createDraft',
			description: 'Create a draft email message',
			scopes: ['mail.write'],
			method: 'POST',
			endpoint: '/me/messages',
			body: {
				subject: '{{ input.subject }}',
				body: '{{ input.body }}',
				toRecipients: '{{ input.toRecipients }}',
				isDraft: true,
			},
			inputSchema: z.object({
				subject: z.string().optional().describe('Subject of the draft'),
				body: z.object({
					contentType: z.enum(['Text', 'HTML']).optional(),
					content: z.string().optional(),
				}).optional().describe('Body of the draft'),
				toRecipients: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
				})).optional().describe('Recipients for the draft'),
				isDraft: z.boolean().optional().describe('Whether this is a draft (always true for this tool)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				subject: z.string().optional(),
				isDraft: z.boolean(),
				createdDateTime: z.string().optional(),
			}),
		},
		{
			handle: 'listFolders',
			description: 'List mail folders in the user\'s mailbox',
			scopes: ['mail.read'],
			method: 'GET',
			endpoint: '/me/mailFolders',
			queryParams: {
				'$top': '{{ input.$top }}',
				'$skip': '{{ input.$skip }}',
				includeHiddenFolders: '{{ input.includeHiddenFolders }}',
			},
			inputSchema: z.object({
				$top: z.number().int().min(1).optional().describe('Maximum number of folders to return'),
				$skip: z.number().int().min(0).optional().describe('Number of folders to skip'),
				includeHiddenFolders: z.boolean().optional().describe('Whether to include hidden folders'),
			}),
			outputSchema: z.object({
				value: z.array(z.object({
					id: z.string(),
					displayName: z.string(),
					parentFolderId: z.string().optional(),
					totalItemCount: z.number().optional(),
					unreadItemCount: z.number().optional(),
				})),
			}),
		},
		{
			handle: 'listCalendars',
			description: 'List calendars accessible to the user',
			scopes: ['calendar.read'],
			method: 'GET',
			endpoint: '/me/calendars',
			queryParams: {
				'$select': '{{ input.$select }}',
			},
			inputSchema: z.object({
				$select: z.string().optional().describe('Comma-separated list of properties to include'),
			}),
			outputSchema: z.object({
				value: z.array(z.object({
					id: z.string(),
					name: z.string(),
					color: z.string().optional(),
					isDefaultCalendar: z.boolean().optional(),
					canEdit: z.boolean().optional(),
					owner: z.object({
						name: z.string().optional(),
						address: z.string().optional(),
					}).optional(),
				})),
			}),
		},
		{
			handle: 'listCalendarEvents',
			description: 'List calendar events from the user\'s default calendar',
			scopes: ['calendar.read'],
			method: 'GET',
			endpoint: '/me/events',
			queryParams: {
				'$filter': '{{ input.$filter }}',
				'$top': '{{ input.$top }}',
				'$orderby': '{{ input.$orderby }}',
				'$select': '{{ input.$select }}',
			},
			inputSchema: z.object({
				$filter: z.string().optional().describe('OData filter expression'),
				$top: z.number().int().min(1).optional().describe('Maximum number of events to return'),
				$orderby: z.string().optional().describe('OData orderby expression'),
				$select: z.string().optional().describe('Comma-separated list of properties to include'),
			}),
			outputSchema: z.object({
				'@odata.nextLink': z.string().optional(),
				value: z.array(z.object({
					id: z.string(),
					subject: z.string().optional(),
					start: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
					end: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
					location: z.object({ displayName: z.string().optional() }).optional(),
					organizer: z.object({
						emailAddress: z.object({ name: z.string().optional(), address: z.string() }),
					}).optional(),
				})),
			}),
		},
		{
			handle: 'createCalendarEvent',
			description: 'Create a new calendar event',
			scopes: ['calendar.write'],
			method: 'POST',
			endpoint: '/me/events',
			body: {
				subject: '{{ input.subject }}',
				body: '{{ input.body }}',
				start: '{{ input.start }}',
				end: '{{ input.end }}',
				location: '{{ input.location }}',
				attendees: '{{ input.attendees }}',
				isOnlineMeeting: '{{ input.isOnlineMeeting }}',
				onlineMeetingProvider: '{{ input.onlineMeetingProvider }}',
				recurrence: '{{ input.recurrence }}',
				reminderMinutesBeforeStart: '{{ input.reminderMinutesBeforeStart }}',
			},
			inputSchema: z.object({
				subject: z.string().describe('Subject of the calendar event'),
				body: z.object({
					contentType: z.enum(['text', 'html']).optional(),
					content: z.string().optional(),
				}).optional().describe('Body/description of the event'),
				start: z.object({
					dateTime: z.string().describe('ISO 8601 date-time string'),
					timeZone: z.string().describe('IANA timezone string'),
				}).describe('Start date and time of the event'),
				end: z.object({
					dateTime: z.string().describe('ISO 8601 date-time string'),
					timeZone: z.string().describe('IANA timezone string'),
				}).describe('End date and time of the event'),
				location: z.object({
					displayName: z.string(),
				}).optional().describe('Location of the event'),
				attendees: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
					type: z.enum(['required', 'optional', 'resource']).optional(),
				})).optional().describe('List of attendees'),
				isOnlineMeeting: z.boolean().optional().describe('Whether this is an online meeting'),
				onlineMeetingProvider: z.string().optional().describe('Online meeting provider (teamsForBusiness, skypeForBusiness, etc.)'),
				recurrence: z.record(z.unknown()).optional().describe('Recurrence pattern for recurring events'),
				reminderMinutesBeforeStart: z.number().int().optional().describe('Reminder time in minutes before the event starts'),
			}),
			outputSchema: z.object({
				id: z.string(),
				subject: z.string().optional(),
				start: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
				end: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
				webLink: z.string().optional(),
				onlineMeetingUrl: z.string().optional(),
			}),
		},
		{
			handle: 'updateCalendarEvent',
			description: 'Update an existing calendar event',
			scopes: ['calendar.write'],
			method: 'PATCH',
			endpoint: '/me/events/{{ input.id }}',
			body: {
				subject: '{{ input.subject }}',
				body: '{{ input.body }}',
				start: '{{ input.start }}',
				end: '{{ input.end }}',
				location: '{{ input.location }}',
				attendees: '{{ input.attendees }}',
			},
			inputSchema: z.object({
				id: z.string().describe('The ID of the event to update'),
				subject: z.string().optional().describe('Updated subject'),
				body: z.object({
					contentType: z.enum(['text', 'html']).optional(),
					content: z.string().optional(),
				}).optional().describe('Updated body/description'),
				start: z.object({
					dateTime: z.string(),
					timeZone: z.string(),
				}).optional().describe('Updated start date and time'),
				end: z.object({
					dateTime: z.string(),
					timeZone: z.string(),
				}).optional().describe('Updated end date and time'),
				location: z.object({
					displayName: z.string(),
				}).optional().describe('Updated location'),
				attendees: z.array(z.object({
					emailAddress: z.object({
						address: z.string().email(),
						name: z.string().optional(),
					}),
					type: z.enum(['required', 'optional', 'resource']).optional(),
				})).optional().describe('Updated list of attendees'),
			}),
			outputSchema: z.object({
				id: z.string(),
				subject: z.string().optional(),
				start: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
				end: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
			}),
		},
		{
			handle: 'deleteCalendarEvent',
			description: 'Delete a calendar event',
			scopes: ['calendar.write'],
			method: 'DELETE',
			endpoint: '/me/events/{{ input.id }}',
			inputSchema: z.object({
				id: z.string().describe('The ID of the calendar event to delete'),
			}),
		},
		{
			handle: 'getCalendarView',
			description: 'Get calendar events within a specific time window',
			scopes: ['calendar.read'],
			method: 'GET',
			endpoint: '/me/calendarView',
			queryParams: {
				startDateTime: '{{ input.startDateTime }}',
				endDateTime: '{{ input.endDateTime }}',
				'$top': '{{ input.$top }}',
				'$orderby': '{{ input.$orderby }}',
			},
			inputSchema: z.object({
				startDateTime: z.string().describe('Start of the time window (ISO 8601 format)'),
				endDateTime: z.string().describe('End of the time window (ISO 8601 format)'),
				$top: z.number().int().min(1).optional().describe('Maximum number of events to return'),
				$orderby: z.string().optional().describe('OData orderby expression'),
			}),
			outputSchema: z.object({
				'@odata.nextLink': z.string().optional(),
				value: z.array(z.object({
					id: z.string(),
					subject: z.string().optional(),
					start: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
					end: z.object({ dateTime: z.string(), timeZone: z.string() }).optional(),
					isAllDay: z.boolean().optional(),
					isCancelled: z.boolean().optional(),
					organizer: z.object({
						emailAddress: z.object({ name: z.string().optional(), address: z.string() }),
					}).optional(),
				})),
			}),
		},
		{
			handle: 'listContacts',
			description: 'List contacts from the user\'s default contacts folder',
			scopes: ['contacts.read'],
			method: 'GET',
			endpoint: '/me/contacts',
			queryParams: {
				'$top': '{{ input.$top }}',
				'$skip': '{{ input.$skip }}',
				'$filter': '{{ input.$filter }}',
				'$select': '{{ input.$select }}',
			},
			inputSchema: z.object({
				$top: z.number().int().min(1).optional().describe('Maximum number of contacts to return'),
				$skip: z.number().int().min(0).optional().describe('Number of contacts to skip'),
				$filter: z.string().optional().describe('OData filter expression'),
				$select: z.string().optional().describe('Comma-separated list of properties to include'),
			}),
			outputSchema: z.object({
				'@odata.nextLink': z.string().optional(),
				value: z.array(z.object({
					id: z.string(),
					displayName: z.string().optional(),
					givenName: z.string().optional(),
					surname: z.string().optional(),
					emailAddresses: z.array(z.object({
						name: z.string().optional(),
						address: z.string(),
					})).optional(),
					businessPhones: z.array(z.string()).optional(),
					companyName: z.string().optional(),
					jobTitle: z.string().optional(),
				})),
			}),
		},
		{
			handle: 'createContact',
			description: 'Create a new contact in the user\'s default contacts folder',
			scopes: ['contacts.write'],
			method: 'POST',
			endpoint: '/me/contacts',
			body: {
				givenName: '{{ input.givenName }}',
				surname: '{{ input.surname }}',
				emailAddresses: '{{ input.emailAddresses }}',
				businessPhones: '{{ input.businessPhones }}',
				mobilePhone: '{{ input.mobilePhone }}',
				companyName: '{{ input.companyName }}',
				jobTitle: '{{ input.jobTitle }}',
			},
			inputSchema: z.object({
				givenName: z.string().optional().describe('First name of the contact'),
				surname: z.string().optional().describe('Last name of the contact'),
				emailAddresses: z.array(z.object({
					address: z.string().email(),
					name: z.string().optional(),
				})).optional().describe('Email addresses for the contact'),
				businessPhones: z.array(z.string()).optional().describe('Business phone numbers'),
				mobilePhone: z.string().optional().describe('Mobile phone number'),
				companyName: z.string().optional().describe('Company the contact works for'),
				jobTitle: z.string().optional().describe('Job title of the contact'),
			}),
			outputSchema: z.object({
				id: z.string(),
				displayName: z.string().optional(),
				givenName: z.string().optional(),
				surname: z.string().optional(),
				emailAddresses: z.array(z.object({
					address: z.string(),
					name: z.string().optional(),
				})).optional(),
				createdDateTime: z.string().optional(),
			}),
		},
		{
			handle: 'getProfile',
			description: 'Get the profile information for the authenticated user',
			scopes: ['mail.read'],
			method: 'GET',
			endpoint: '/me',
			inputSchema: z.object({}),
			outputSchema: z.object({
				id: z.string(),
				displayName: z.string().optional(),
				mail: z.string().optional(),
				userPrincipalName: z.string().optional(),
				givenName: z.string().optional(),
				surname: z.string().optional(),
				jobTitle: z.string().optional(),
				officeLocation: z.string().optional(),
				mobilePhone: z.string().optional(),
			}),
		},
	],
};
