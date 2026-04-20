/**
 * @module integrations/googleCalendar
 * Google Calendar API v3 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const googleCalendarDefinition: IntegrationDefinition = {
	name: 'Google Calendar',
	instructions: `
### calendarId
\`"primary"\` always refers to the authenticated user's main calendar. To work with another calendar, call \`listCalendars\` and use the returned \`id\` (an email-like string, e.g. \`team@group.calendar.google.com\`).

### Timed vs all-day events
The \`start\` and \`end\` objects must use **exactly one** shape:
- **Timed event**: \`{ "dateTime": "2026-04-20T14:30:00-07:00", "timeZone": "America/Los_Angeles" }\`. Use an RFC 3339 timestamp with offset, and an IANA timezone in \`timeZone\`.
- **All-day event**: \`{ "date": "2026-04-20" }\` (YYYY-MM-DD, no time). The \`end.date\` is **exclusive** — a one-day event on April 20 needs \`end.date: "2026-04-21"\`.

Never mix \`dateTime\` and \`date\` in the same object.

### Recurrence
\`recurrence\` is an array of RFC 5545 rule strings, each prefixed:
- \`"RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261231T000000Z"\`
- \`"EXDATE;TZID=America/Los_Angeles:20261225T090000"\` (skip Christmas)

Use UTC (\`Z\`) for \`UNTIL\` when the event itself is in a named timezone — mixing them causes silent off-by-one errors.

### Updates
\`updateEvent\` is **PUT**, so it replaces the event body. Fetch with \`getEvent\` first, merge your changes, then send the full object. Omitting a field **clears it** on the server.

### Attendees and invites
Attendees get invites automatically when an event is created/updated unless \`sendUpdates=none\` is set (not currently exposed here). Each attendee is an object with at least \`email\`. Mark optional attendees with \`optional: true\`.

### Free/busy
\`listFreeBusy\` takes an \`items\` array of \`{ id: "calendarId" }\` plus \`timeMin\`/\`timeMax\` in RFC 3339. Use it to find open slots without reading each event — much cheaper than \`listEvents\` when you only need availability.

### Quick-add
\`quickAddEvent\` parses a natural-language string (\`"Lunch with Alex tomorrow 12-1pm"\`) and creates the event. Good for casual user input; no control over attendees, reminders, or recurrence — use \`createEvent\` when precision matters.

### Timezones
If \`timeZone\` is omitted, Google falls back to the calendar's default zone. When the agent's input comes from a human ("next Tuesday at 3pm"), always explicitly set \`timeZone\` to the user's local zone rather than assuming UTC.
`,
	apiSetup: {
		baseUrl: 'https://www.googleapis.com/calendar/v3',
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
				'https://www.googleapis.com/auth/calendar',
				'https://www.googleapis.com/auth/calendar.readonly',
			],
		},
	],
	scopes: {
		read: 'Read calendars and events',
		write: 'Create and update calendars and events',
		freebusy: 'Query free/busy availability information',
	},
	tools: [
		// ── Calendars ─────────────────────────────────────────────────────────────

		{
			handle: 'listCalendars',
			description: 'List all calendars in the authenticated user\'s calendar list.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/me/calendarList',
			queryParams: {
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				showDeleted: '{{ input.showDeleted }}',
				showHidden: '{{ input.showHidden }}',
			},
			inputSchema: z.object({
				maxResults: z.number().int().min(1).max(250).optional().describe('Maximum number of entries to return (max 250, default 100)'),
				pageToken: z.string().optional().describe('Pagination token from a previous response'),
				showDeleted: z.boolean().optional().describe('Whether to include deleted calendar list entries (default false)'),
				showHidden: z.boolean().optional().describe('Whether to include hidden calendars (default false)'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#calendarList'),
				nextPageToken: z.string().optional(),
				items: z.array(z.object({
					kind: z.literal('calendar#calendarListEntry'),
					id: z.string(),
					summary: z.string(),
					timeZone: z.string().optional(),
					accessRole: z.string(),
					primary: z.boolean().optional(),
				})),
			}),
		},

		{
			handle: 'getCalendar',
			description: 'Retrieve metadata for a specific calendar.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/calendars/{{ input.calendarId }}',
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#calendar'),
				id: z.string(),
				summary: z.string(),
				description: z.string().optional(),
				timeZone: z.string().optional(),
				location: z.string().optional(),
			}),
		},

		{
			handle: 'createCalendar',
			description: 'Create a new secondary calendar for the authenticated user.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/calendars',
			body: {
				summary: '{{ input.summary }}',
				description: '{{ input.description }}',
				timeZone: '{{ input.timeZone }}',
				location: '{{ input.location }}',
			},
			inputSchema: z.object({
				summary: z.string().describe('Title of the new calendar'),
				description: z.string().optional().describe('Description of the calendar'),
				timeZone: z.string().optional().describe('IANA timezone string, e.g. "America/New_York"'),
				location: z.string().optional().describe('Geographic location of the calendar (free-form text)'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#calendar'),
				id: z.string(),
				summary: z.string(),
			}),
		},

		{
			handle: 'deleteCalendar',
			description: 'Permanently delete a secondary calendar. The primary calendar cannot be deleted.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/calendars/{{ input.calendarId }}',
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier of the secondary calendar to delete'),
			}),
			outputSchema: z.object({}),
		},

		// ── Events ────────────────────────────────────────────────────────────────

		{
			handle: 'listEvents',
			description: 'List events on a calendar with optional time range filtering, full-text search, and pagination.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/calendars/{{ input.calendarId }}/events',
			queryParams: {
				timeMin: '{{ input.timeMin }}',
				timeMax: '{{ input.timeMax }}',
				maxResults: '{{ input.maxResults }}',
				pageToken: '{{ input.pageToken }}',
				q: '{{ input.q }}',
				orderBy: '{{ input.orderBy }}',
				singleEvents: '{{ input.singleEvents }}',
				showDeleted: '{{ input.showDeleted }}',
			},
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				timeMin: z.string().optional().describe('Lower bound (inclusive) for event start time (RFC 3339 timestamp, e.g. "2024-01-01T00:00:00Z")'),
				timeMax: z.string().optional().describe('Upper bound (exclusive) for event end time (RFC 3339 timestamp)'),
				maxResults: z.number().int().min(1).max(2500).optional().describe('Maximum number of events to return (max 2500, default 250)'),
				pageToken: z.string().optional().describe('Pagination token from a previous response'),
				q: z.string().optional().describe('Free-text search query — searches summary, description, location, and attendees'),
				orderBy: z.enum(['startTime', 'updated']).optional().describe('Sort order. "startTime" requires singleEvents=true.'),
				singleEvents: z.boolean().optional().describe('Whether to expand recurring events into single instances (default false)'),
				showDeleted: z.boolean().optional().describe('Whether to include deleted events in the result (default false)'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#events'),
				summary: z.string().optional(),
				nextPageToken: z.string().optional(),
				items: z.array(z.record(z.unknown())),
			}),
		},

		{
			handle: 'getEvent',
			description: 'Retrieve a single event by its ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/calendars/{{ input.calendarId }}/events/{{ input.eventId }}',
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				eventId: z.string().describe('Event identifier'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#event'),
				id: z.string(),
				status: z.string(),
				summary: z.string().optional(),
				description: z.string().optional(),
				location: z.string().optional(),
				start: z.record(z.unknown()),
				end: z.record(z.unknown()),
				attendees: z.array(z.record(z.unknown())).optional(),
				htmlLink: z.string().optional(),
			}),
		},

		{
			handle: 'createEvent',
			description: 'Create a new event on a calendar. Supports all-day events, timed events, recurring events, and attendees.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/calendars/{{ input.calendarId }}/events',
			body: {
				summary: '{{ input.summary }}',
				description: '{{ input.description }}',
				start: '{{ input.start }}',
				end: '{{ input.end }}',
				location: '{{ input.location }}',
				attendees: '{{ input.attendees }}',
				recurrence: '{{ input.recurrence }}',
				reminders: '{{ input.reminders }}',
				colorId: '{{ input.colorId }}',
				status: '{{ input.status }}',
			},
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				summary: z.string().describe('Title of the event'),
				description: z.string().optional().describe('Description or notes for the event (supports HTML)'),
				start: z.object({
					dateTime: z.string().optional().describe('RFC 3339 timestamp for timed events, e.g. "2024-01-15T10:00:00-05:00"'),
					date: z.string().optional().describe('Date in YYYY-MM-DD format for all-day events'),
					timeZone: z.string().optional().describe('IANA timezone, e.g. "America/New_York"'),
				}).describe('Event start time'),
				end: z.object({
					dateTime: z.string().optional().describe('RFC 3339 timestamp for timed events'),
					date: z.string().optional().describe('Date in YYYY-MM-DD format for all-day events (exclusive)'),
					timeZone: z.string().optional().describe('IANA timezone'),
				}).describe('Event end time'),
				location: z.string().optional().describe('Geographic location or address of the event'),
				attendees: z.array(z.object({
					email: z.string().email(),
					displayName: z.string().optional(),
					optional: z.boolean().optional(),
				})).optional().describe('List of attendees'),
				recurrence: z.array(z.string()).optional().describe('RRULE / EXRULE / RDATE / EXDATE strings defining recurrence, e.g. ["RRULE:FREQ=WEEKLY;BYDAY=MO"]'),
				reminders: z.object({
					useDefault: z.boolean().optional(),
					overrides: z.array(z.object({
						method: z.enum(['email', 'popup']),
						minutes: z.number().int(),
					})).optional(),
				}).optional().describe('Event reminders configuration'),
				colorId: z.string().optional().describe('Event color ID (1–11, see Google Calendar color table)'),
				status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('Event status'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#event'),
				id: z.string(),
				status: z.string(),
				htmlLink: z.string(),
				summary: z.string().optional(),
				start: z.record(z.unknown()),
				end: z.record(z.unknown()),
			}),
		},

		{
			handle: 'updateEvent',
			description: 'Update an existing calendar event. Replaces the event with the provided fields (PUT semantics — supply all required fields).',
			scopes: ['write'],
			method: 'PUT',
			endpoint: '/calendars/{{ input.calendarId }}/events/{{ input.eventId }}',
			body: {
				summary: '{{ input.summary }}',
				description: '{{ input.description }}',
				start: '{{ input.start }}',
				end: '{{ input.end }}',
				location: '{{ input.location }}',
				attendees: '{{ input.attendees }}',
				reminders: '{{ input.reminders }}',
				status: '{{ input.status }}',
			},
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				eventId: z.string().describe('Event identifier to update'),
				summary: z.string().optional().describe('Updated event title'),
				description: z.string().optional().describe('Updated description'),
				start: z.object({
					dateTime: z.string().optional(),
					date: z.string().optional(),
					timeZone: z.string().optional(),
				}).optional().describe('Updated start time'),
				end: z.object({
					dateTime: z.string().optional(),
					date: z.string().optional(),
					timeZone: z.string().optional(),
				}).optional().describe('Updated end time'),
				location: z.string().optional().describe('Updated location'),
				attendees: z.array(z.object({
					email: z.string().email(),
					displayName: z.string().optional(),
					optional: z.boolean().optional(),
				})).optional().describe('Updated attendees list'),
				reminders: z.object({
					useDefault: z.boolean().optional(),
					overrides: z.array(z.object({
						method: z.enum(['email', 'popup']),
						minutes: z.number().int(),
					})).optional(),
				}).optional().describe('Updated reminders'),
				status: z.enum(['confirmed', 'tentative', 'cancelled']).optional().describe('Updated event status'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#event'),
				id: z.string(),
				status: z.string(),
				summary: z.string().optional(),
				start: z.record(z.unknown()),
				end: z.record(z.unknown()),
			}),
		},

		{
			handle: 'deleteEvent',
			description: 'Permanently delete a calendar event.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/calendars/{{ input.calendarId }}/events/{{ input.eventId }}',
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				eventId: z.string().describe('Event identifier to delete'),
			}),
			outputSchema: z.object({}),
		},

		{
			handle: 'quickAddEvent',
			description: 'Create an event from a natural-language text string (e.g. "Lunch with John tomorrow at noon"). The API parses the text and fills in the event details.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/calendars/{{ input.calendarId }}/events/quickAdd',
			queryParams: {
				text: '{{ input.text }}',
			},
			inputSchema: z.object({
				calendarId: z.string().describe('Calendar identifier. Use "primary" for the user\'s primary calendar.'),
				text: z.string().describe('Natural-language text describing the event, e.g. "Doctor appointment Friday at 3pm"'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#event'),
				id: z.string(),
				status: z.string(),
				summary: z.string().optional(),
				start: z.record(z.unknown()),
				end: z.record(z.unknown()),
			}),
		},

		// ── Free/Busy ─────────────────────────────────────────────────────────────

		{
			handle: 'listFreeBusy',
			description: 'Query free/busy information for a set of calendars within a time range. Useful for scheduling meetings without reading full event details.',
			scopes: ['freebusy'],
			method: 'POST',
			endpoint: '/freeBusy',
			body: {
				timeMin: '{{ input.timeMin }}',
				timeMax: '{{ input.timeMax }}',
				items: '{{ input.items }}',
				timeZone: '{{ input.timeZone }}',
			},
			inputSchema: z.object({
				timeMin: z.string().describe('Start of the time range to query (RFC 3339 timestamp)'),
				timeMax: z.string().describe('End of the time range to query (RFC 3339 timestamp)'),
				items: z.array(z.object({
					id: z.string().describe('Calendar identifier'),
				})).describe('List of calendars to query'),
				timeZone: z.string().optional().describe('IANA timezone for the response (default UTC)'),
			}),
			outputSchema: z.object({
				kind: z.literal('calendar#freeBusy'),
				timeMin: z.string(),
				timeMax: z.string(),
				calendars: z.record(z.object({
					busy: z.array(z.object({
						start: z.string(),
						end: z.string(),
					})),
					errors: z.array(z.record(z.unknown())).optional(),
				})),
			}),
		},

		// ── Settings ──────────────────────────────────────────────────────────────

		{
			handle: 'getSettings',
			description: 'Retrieve all user settings for Google Calendar (e.g. timezone, locale, date format preferences).',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/users/me/settings',
			inputSchema: z.object({}),
			outputSchema: z.object({
				kind: z.literal('calendar#settings'),
				items: z.array(z.object({
					kind: z.literal('calendar#setting'),
					id: z.string(),
					value: z.string(),
				})),
			}),
		},
	],
};
