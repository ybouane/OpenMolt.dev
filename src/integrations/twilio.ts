/**
 * @module integrations/twilio
 * Twilio REST API integration definition.
 *
 * Credential config fields:
 *   - username: Twilio Account SID (also used in endpoint paths via {{ config.username }})
 *   - password: Twilio Auth Token
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const twilioDefinition: IntegrationDefinition = {
	name: 'Twilio',
	apiSetup: {
		baseUrl: 'https://api.twilio.com/2010-04-01',
		requestFormat: 'url-encoded',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'basic',
			username: '{{ config.username }}',
			password: '{{ config.password }}',
		},
	],
	scopes: {
		sms: 'Send and manage SMS messages',
		voice: 'Make and manage phone calls',
		verify: 'Use Twilio Verify for OTP/verification flows',
		lookup: 'Look up phone number information',
	},
	tools: [
		{
			handle: 'sendSMS',
			description: 'Send an SMS message via Twilio.',
			scopes: ['sms'],
			method: 'POST',
			endpoint: '/Accounts/{{ config.username }}/Messages.json',
			body: {
				From: '{{ input.from }}',
				To: '{{ input.to }}',
				Body: '{{ input.body }}',
				StatusCallback: '{{ input.statusCallback }}',
				MediaUrl: '{{ input.mediaUrl }}',
			},
			inputSchema: z.object({
				from: z.string().describe('Sender phone number (E.164, e.g. +15551234567)'),
				to: z.string().describe('Recipient phone number (E.164)'),
				body: z.string().describe('Text body of the SMS message'),
				statusCallback: z.string().url().optional().describe('URL for status callback webhooks'),
				mediaUrl: z.string().url().optional().describe('URL of media to include (MMS)'),
			}),
		},

		{
			handle: 'sendWhatsApp',
			description: 'Send a WhatsApp message via Twilio. Prefix from/to with "whatsapp:".',
			scopes: ['sms'],
			method: 'POST',
			endpoint: '/Accounts/{{ config.username }}/Messages.json',
			body: {
				From: '{{ input.from }}',
				To: '{{ input.to }}',
				Body: '{{ input.body }}',
				MediaUrl: '{{ input.mediaUrl }}',
			},
			inputSchema: z.object({
				from: z.string().describe('Sender WhatsApp number prefixed with "whatsapp:" (e.g. whatsapp:+14155238886)'),
				to: z.string().describe('Recipient WhatsApp number prefixed with "whatsapp:"'),
				body: z.string().describe('Text body of the WhatsApp message'),
				mediaUrl: z.string().url().optional().describe('URL of media to include'),
			}),
		},

		{
			handle: 'makeCall',
			description: 'Initiate an outbound phone call via Twilio.',
			scopes: ['voice'],
			method: 'POST',
			endpoint: '/Accounts/{{ config.username }}/Calls.json',
			body: {
				From: '{{ input.from }}',
				To: '{{ input.to }}',
				Url: '{{ input.url }}',
				Twiml: '{{ input.twiml }}',
				Method: '{{ input.method }}',
				StatusCallback: '{{ input.statusCallback }}',
				Record: '{{ input.record }}',
			},
			inputSchema: z.object({
				from: z.string().describe('Caller phone number (E.164)'),
				to: z.string().describe('Callee phone number (E.164)'),
				url: z.string().url().optional().describe('URL of TwiML instructions'),
				twiml: z.string().optional().describe('Inline TwiML instructions'),
				method: z.string().optional().describe('HTTP method for fetching TwiML URL (GET or POST)'),
				statusCallback: z.string().url().optional().describe('URL for call status webhooks'),
				record: z.boolean().optional().describe('Whether to record the call'),
			}),
		},

		{
			handle: 'listMessages',
			description: 'List SMS/MMS messages for the account.',
			scopes: ['sms'],
			method: 'GET',
			endpoint: '/Accounts/{{ config.username }}/Messages.json',
			queryParams: {
				To: '{{ input.to }}',
				From: '{{ input.from }}',
				DateSent: '{{ input.dateSent }}',
				PageSize: '{{ input.pageSize }}',
				Page: '{{ input.page }}',
			},
			inputSchema: z.object({
				to: z.string().optional().describe('Filter by recipient phone number'),
				from: z.string().optional().describe('Filter by sender phone number'),
				dateSent: z.string().optional().describe('Filter by date sent (YYYY-MM-DD)'),
				pageSize: z.number().int().min(1).max(1000).optional().describe('Records per page (max 1000)'),
				page: z.number().int().min(0).optional().describe('Page number (zero-indexed)'),
			}),
		},

		{
			handle: 'getMessage',
			description: 'Retrieve a single message by SID.',
			scopes: ['sms'],
			method: 'GET',
			endpoint: '/Accounts/{{ config.username }}/Messages/{{ input.messageSid }}.json',
			inputSchema: z.object({
				messageSid: z.string().describe('Message SID (SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Delete a message record by SID.',
			scopes: ['sms'],
			method: 'DELETE',
			endpoint: '/Accounts/{{ config.username }}/Messages/{{ input.messageSid }}.json',
			inputSchema: z.object({
				messageSid: z.string().describe('Message SID to delete'),
			}),
		},

		{
			handle: 'listCalls',
			description: 'List phone calls for the account.',
			scopes: ['voice'],
			method: 'GET',
			endpoint: '/Accounts/{{ config.username }}/Calls.json',
			queryParams: {
				To: '{{ input.to }}',
				From: '{{ input.from }}',
				Status: '{{ input.status }}',
				PageSize: '{{ input.pageSize }}',
			},
			inputSchema: z.object({
				to: z.string().optional().describe('Filter by callee phone number'),
				from: z.string().optional().describe('Filter by caller phone number'),
				status: z.string().optional().describe('Filter by status (completed, in-progress, failed)'),
				pageSize: z.number().int().min(1).max(1000).optional().describe('Records per page (max 1000)'),
			}),
		},

		{
			handle: 'getCall',
			description: 'Retrieve a single call by SID.',
			scopes: ['voice'],
			method: 'GET',
			endpoint: '/Accounts/{{ config.username }}/Calls/{{ input.callSid }}.json',
			inputSchema: z.object({
				callSid: z.string().describe('Call SID (CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
			}),
		},

		{
			handle: 'listPhoneNumbers',
			description: 'List phone numbers purchased on the Twilio account.',
			scopes: ['sms', 'voice'],
			method: 'GET',
			endpoint: '/Accounts/{{ config.username }}/IncomingPhoneNumbers.json',
			queryParams: {
				PageSize: '{{ input.pageSize }}',
				FriendlyName: '{{ input.friendlyName }}',
			},
			inputSchema: z.object({
				pageSize: z.number().int().min(1).max(1000).optional().describe('Records per page (max 1000)'),
				friendlyName: z.string().optional().describe('Filter by friendly name'),
			}),
		},

		{
			handle: 'lookupNumber',
			description: 'Look up information about a phone number using the Twilio Lookup API v2.',
			scopes: ['lookup'],
			method: 'GET',
			endpoint: 'https://lookups.twilio.com/v2/PhoneNumbers/{{ input.phoneNumber }}',
			queryParams: {
				Fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				phoneNumber: z.string().describe('Phone number to look up (E.164, e.g. +15551234567)'),
				fields: z.string().optional().describe('Comma-separated data packages (e.g. "line_type_intelligence,caller_name")'),
			}),
		},

		{
			handle: 'createVerification',
			description: 'Start a verification flow by sending an OTP via SMS, call, or email.',
			scopes: ['verify'],
			method: 'POST',
			endpoint: 'https://verify.twilio.com/v2/Services/{{ input.serviceSid }}/Verifications',
			body: {
				To: '{{ input.to }}',
				Channel: '{{ input.channel }}',
			},
			inputSchema: z.object({
				serviceSid: z.string().describe('Verify service SID (VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
				to: z.string().describe('Phone number or email to send the verification to'),
				channel: z.enum(['sms', 'call', 'email']).describe('Verification channel'),
			}),
		},

		{
			handle: 'checkVerification',
			description: 'Check a verification code to complete the verification flow.',
			scopes: ['verify'],
			method: 'POST',
			endpoint: 'https://verify.twilio.com/v2/Services/{{ input.serviceSid }}/VerificationCheck',
			body: {
				To: '{{ input.to }}',
				Code: '{{ input.code }}',
			},
			inputSchema: z.object({
				serviceSid: z.string().describe('Verify service SID (VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
				to: z.string().describe('Phone number or email that received the code'),
				code: z.string().describe('Verification code entered by the user'),
			}),
		},
	],
};
