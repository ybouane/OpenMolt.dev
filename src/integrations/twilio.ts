/**
 * @module integrations/twilio
 * Twilio REST API integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const twilioDefinition: IntegrationDefinition = {
	name: 'Twilio',
	apiSetup: {
		baseUrl: 'https://api.twilio.com/2010-04-01',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		requestFormat: 'form-data',
		responseFormat: 'json',
	},
	credentialSetup: [
		{
			type: 'basic',
			username: '{{ config.accountSid }}',
			password: '{{ config.authToken }}',
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
			description: 'Send an SMS message via Twilio. Supports optional status callback and media URLs for MMS.',
			scopes: ['sms'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const body = new URLSearchParams();
				body.set('From', input.from as string);
				body.set('To', input.to as string);
				body.set('Body', input.body as string);
				if (input.statusCallback) body.set('StatusCallback', input.statusCallback as string);
				if (input.mediaUrl) body.set('MediaUrl', input.mediaUrl as string);

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: body.toString(),
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				from: z.string().describe('The sender phone number (E.164 format, e.g. +15551234567)'),
				to: z.string().describe('The recipient phone number (E.164 format)'),
				body: z.string().describe('The text body of the SMS message'),
				statusCallback: z.string().url().optional().describe('URL to receive status callback webhooks'),
				mediaUrl: z.string().url().optional().describe('URL of media to include (for MMS)'),
			}),
		},

		{
			handle: 'sendWhatsApp',
			description: 'Send a WhatsApp message via Twilio. The from/to numbers should be prefixed with "whatsapp:".',
			scopes: ['sms'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const body = new URLSearchParams();
				body.set('From', input.from as string);
				body.set('To', input.to as string);
				body.set('Body', input.body as string);
				if (input.mediaUrl) body.set('MediaUrl', input.mediaUrl as string);

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: body.toString(),
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				from: z.string().describe('The sender WhatsApp number prefixed with "whatsapp:" (e.g. whatsapp:+14155238886)'),
				to: z.string().describe('The recipient WhatsApp number prefixed with "whatsapp:" (e.g. whatsapp:+15551234567)'),
				body: z.string().describe('The text body of the WhatsApp message'),
				mediaUrl: z.string().url().optional().describe('URL of media to include in the WhatsApp message'),
			}),
		},

		{
			handle: 'makeCall',
			description: 'Initiate an outbound phone call via Twilio. Provide either a TwiML URL or inline TwiML.',
			scopes: ['voice'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const body = new URLSearchParams();
				body.set('From', input.from as string);
				body.set('To', input.to as string);
				if (input.url) body.set('Url', input.url as string);
				if (input.twiml) body.set('Twiml', input.twiml as string);
				if (input.method) body.set('Method', input.method as string);
				if (input.statusCallback) body.set('StatusCallback', input.statusCallback as string);
				if (input.record !== undefined) body.set('Record', String(input.record));

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: body.toString(),
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				from: z.string().describe('The caller phone number (E.164 format)'),
				to: z.string().describe('The callee phone number (E.164 format)'),
				url: z.string().url().optional().describe('URL of TwiML instructions for the call'),
				twiml: z.string().optional().describe('Inline TwiML instructions for the call'),
				method: z.string().optional().describe('HTTP method to use when fetching the TwiML URL (GET or POST)'),
				statusCallback: z.string().url().optional().describe('URL to receive call status webhooks'),
				record: z.boolean().optional().describe('Whether to record the call'),
			}),
		},

		{
			handle: 'listMessages',
			description: 'List SMS/MMS messages for the account with optional filters.',
			scopes: ['sms'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const params = new URLSearchParams();
				if (input.to) params.set('To', input.to as string);
				if (input.from) params.set('From', input.from as string);
				if (input.dateSent) params.set('DateSent', input.dateSent as string);
				if (input.pageSize) params.set('PageSize', String(input.pageSize));
				if (input.page !== undefined) params.set('Page', String(input.page));

				const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?${params.toString()}`;
				const response = await fetch(url, {
					headers: { Authorization: `Basic ${auth}` },
				});
				return response.json();
			},
			inputSchema: z.object({
				to: z.string().optional().describe('Filter messages sent to this phone number'),
				from: z.string().optional().describe('Filter messages sent from this phone number'),
				dateSent: z.string().optional().describe('Filter messages sent on this date (YYYY-MM-DD)'),
				pageSize: z.number().int().min(1).max(1000).optional().describe('Number of records per page (max 1000)'),
				page: z.number().int().min(0).optional().describe('Page number (zero-indexed)'),
			}),
		},

		{
			handle: 'getMessage',
			description: 'Retrieve a single SMS/MMS message by its SID.',
			scopes: ['sms'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${input.messageSid}.json`,
					{
						headers: { Authorization: `Basic ${auth}` },
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				messageSid: z.string().describe('The SID of the message to retrieve (e.g. SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
			}),
		},

		{
			handle: 'deleteMessage',
			description: 'Delete a message record from Twilio by its SID.',
			scopes: ['sms'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${input.messageSid}.json`,
					{
						method: 'DELETE',
						headers: { Authorization: `Basic ${auth}` },
					},
				);
				if (response.status === 204) return { success: true };
				return response.json();
			},
			inputSchema: z.object({
				messageSid: z.string().describe('The SID of the message to delete'),
			}),
		},

		{
			handle: 'listCalls',
			description: 'List phone calls for the account with optional filters.',
			scopes: ['voice'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const params = new URLSearchParams();
				if (input.to) params.set('To', input.to as string);
				if (input.from) params.set('From', input.from as string);
				if (input.status) params.set('Status', input.status as string);
				if (input.pageSize) params.set('PageSize', String(input.pageSize));

				const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json?${params.toString()}`;
				const response = await fetch(url, {
					headers: { Authorization: `Basic ${auth}` },
				});
				return response.json();
			},
			inputSchema: z.object({
				to: z.string().optional().describe('Filter calls made to this phone number'),
				from: z.string().optional().describe('Filter calls made from this phone number'),
				status: z.string().optional().describe('Filter calls by status (e.g. completed, in-progress, failed)'),
				pageSize: z.number().int().min(1).max(1000).optional().describe('Number of records per page (max 1000)'),
			}),
		},

		{
			handle: 'getCall',
			description: 'Retrieve details of a single phone call by its SID.',
			scopes: ['voice'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const response = await fetch(
					`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${input.callSid}.json`,
					{
						headers: { Authorization: `Basic ${auth}` },
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				callSid: z.string().describe('The SID of the call to retrieve (e.g. CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
			}),
		},

		{
			handle: 'listPhoneNumbers',
			description: 'List all phone numbers purchased and associated with the Twilio account.',
			scopes: ['sms', 'voice'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const params = new URLSearchParams();
				if (input.pageSize) params.set('PageSize', String(input.pageSize));
				if (input.friendlyName) params.set('FriendlyName', input.friendlyName as string);

				const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?${params.toString()}`;
				const response = await fetch(url, {
					headers: { Authorization: `Basic ${auth}` },
				});
				return response.json();
			},
			inputSchema: z.object({
				pageSize: z.number().int().min(1).max(1000).optional().describe('Number of records per page (max 1000)'),
				friendlyName: z.string().optional().describe('Filter by friendly name of the phone number'),
			}),
		},

		{
			handle: 'lookupNumber',
			description: 'Look up information about a phone number using the Twilio Lookup API v2.',
			scopes: ['lookup'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const params = new URLSearchParams();
				if (input.fields) params.set('Fields', input.fields as string);

				const encodedNumber = encodeURIComponent(input.phoneNumber as string);
				const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodedNumber}?${params.toString()}`;
				const response = await fetch(url, {
					headers: { Authorization: `Basic ${auth}` },
				});
				return response.json();
			},
			inputSchema: z.object({
				phoneNumber: z.string().describe('The phone number to look up in E.164 format (e.g. +15551234567)'),
				fields: z.string().optional().describe('Comma-separated list of data packages to include (e.g. "line_type_intelligence,caller_name,sim_swap")'),
			}),
		},

		{
			handle: 'createVerification',
			description: 'Start a verification flow by sending an OTP to a user via SMS, call, or email.',
			scopes: ['verify'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const body = new URLSearchParams();
				body.set('To', input.to as string);
				body.set('Channel', input.channel as string);

				const response = await fetch(
					`https://verify.twilio.com/v2/Services/${input.serviceSid}/Verifications`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: body.toString(),
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				serviceSid: z.string().describe('The SID of the Verify service to use (VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
				to: z.string().describe('The phone number or email address to send the verification to'),
				channel: z.enum(['sms', 'call', 'email']).describe('The verification channel to use'),
			}),
		},

		{
			handle: 'checkVerification',
			description: 'Check a verification code submitted by a user to complete the verification flow.',
			scopes: ['verify'],
			execute: async (input, context) => {
				const accountSid = context.config?.accountSid as string;
				const authToken = context.config?.authToken as string;
				const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

				const body = new URLSearchParams();
				body.set('To', input.to as string);
				body.set('Code', input.code as string);

				const response = await fetch(
					`https://verify.twilio.com/v2/Services/${input.serviceSid}/VerificationCheck`,
					{
						method: 'POST',
						headers: {
							Authorization: `Basic ${auth}`,
							'Content-Type': 'application/x-www-form-urlencoded',
						},
						body: body.toString(),
					},
				);
				return response.json();
			},
			inputSchema: z.object({
				serviceSid: z.string().describe('The SID of the Verify service (VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)'),
				to: z.string().describe('The phone number or email address that received the code'),
				code: z.string().describe('The verification code entered by the user'),
			}),
		},
	],
};
