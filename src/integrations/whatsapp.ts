/**
 * @module integrations/whatsapp
 * WhatsApp Business Cloud API v20.0 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const whatsappDefinition: IntegrationDefinition = {
	name: 'WhatsApp',
	apiSetup: {
		baseUrl: 'https://graph.facebook.com/v20.0',
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
		messages: 'Send and receive all message types (text, media, templates, reactions)',
		media: 'Upload, retrieve, and delete media files',
		profile: 'Read and update the WhatsApp Business profile',
		templates: 'Send pre-approved message templates',
	},
	tools: [
		// ── Text Messages ─────────────────────────────────────────────────────────

		{
			handle: 'sendTextMessage',
			description: 'Send a plain text message to a WhatsApp user. Optionally enable URL preview and set a context for reply threads.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'text',
				text: {
					body: '{{ input.body }}',
					preview_url: '{{ input.previewUrl }}',
				},
				context: '{{ input.context }}',
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID (from Meta Business Manager)'),
				to: z.string().describe('Recipient phone number in E.164 format (e.g. +15551234567)'),
				body: z.string().max(4096).describe('Text message content (max 4096 characters)'),
				previewUrl: z.boolean().optional().describe('Whether to show a URL preview for any links in the message'),
				context: z.object({ message_id: z.string() }).optional().describe('Context object to reply to a specific message: {message_id}'),
			}),
		},

		// ── Template Messages ─────────────────────────────────────────────────────

		{
			handle: 'sendTemplateMessage',
			description: 'Send a pre-approved WhatsApp message template. Templates are required for initiating conversations outside the 24-hour window.',
			scopes: ['messages', 'templates'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				to: '{{ input.to }}',
				type: 'template',
				template: {
					name: '{{ input.templateName }}',
					language: {
						code: '{{ input.languageCode }}',
					},
					components: '{{ input.components }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				templateName: z.string().describe('Name of the pre-approved message template'),
				languageCode: z.string().describe('BCP-47 language code for the template (e.g. "en_US", "es_ES")'),
				components: z.array(z.record(z.unknown())).optional().describe('Array of template component objects (header, body, button variables)'),
			}),
		},

		// ── Image Messages ────────────────────────────────────────────────────────

		{
			handle: 'sendImageMessage',
			description: 'Send an image to a WhatsApp user. Provide either a public image URL or a previously uploaded media ID.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'image',
				image: {
					link: '{{ input.imageUrl }}',
					id: '{{ input.imageId }}',
					caption: '{{ input.caption }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				imageUrl: z.string().url().optional().describe('Publicly accessible HTTPS URL of the image to send'),
				imageId: z.string().optional().describe('Media ID of a previously uploaded image'),
				caption: z.string().max(1024).optional().describe('Image caption text (max 1024 characters)'),
			}).refine(d => d.imageUrl || d.imageId, { message: 'Either imageUrl or imageId must be provided' }),
		},

		// ── Document Messages ─────────────────────────────────────────────────────

		{
			handle: 'sendDocumentMessage',
			description: 'Send a document (PDF, DOCX, etc.) to a WhatsApp user. Provide either a public URL or a media ID.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'document',
				document: {
					link: '{{ input.documentUrl }}',
					id: '{{ input.documentId }}',
					caption: '{{ input.caption }}',
					filename: '{{ input.filename }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				documentUrl: z.string().url().optional().describe('Publicly accessible HTTPS URL of the document'),
				documentId: z.string().optional().describe('Media ID of a previously uploaded document'),
				caption: z.string().max(1024).optional().describe('Document caption (max 1024 characters)'),
				filename: z.string().optional().describe('Display filename shown to the recipient'),
			}).refine(d => d.documentUrl || d.documentId, { message: 'Either documentUrl or documentId must be provided' }),
		},

		// ── Video Messages ────────────────────────────────────────────────────────

		{
			handle: 'sendVideoMessage',
			description: 'Send a video to a WhatsApp user. Provide either a public URL or a media ID.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'video',
				video: {
					link: '{{ input.videoUrl }}',
					id: '{{ input.videoId }}',
					caption: '{{ input.caption }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				videoUrl: z.string().url().optional().describe('Publicly accessible HTTPS URL of the video'),
				videoId: z.string().optional().describe('Media ID of a previously uploaded video'),
				caption: z.string().max(1024).optional().describe('Video caption (max 1024 characters)'),
			}).refine(d => d.videoUrl || d.videoId, { message: 'Either videoUrl or videoId must be provided' }),
		},

		// ── Audio Messages ────────────────────────────────────────────────────────

		{
			handle: 'sendAudioMessage',
			description: 'Send an audio message to a WhatsApp user. Provide either a public URL or a media ID.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'audio',
				audio: {
					link: '{{ input.audioUrl }}',
					id: '{{ input.audioId }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				audioUrl: z.string().url().optional().describe('Publicly accessible HTTPS URL of the audio file'),
				audioId: z.string().optional().describe('Media ID of a previously uploaded audio file'),
			}).refine(d => d.audioUrl || d.audioId, { message: 'Either audioUrl or audioId must be provided' }),
		},

		// ── Location Messages ─────────────────────────────────────────────────────

		{
			handle: 'sendLocationMessage',
			description: 'Send a geographic location pin to a WhatsApp user. Optionally include a name and address label.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'location',
				location: {
					latitude: '{{ input.latitude }}',
					longitude: '{{ input.longitude }}',
					name: '{{ input.name }}',
					address: '{{ input.address }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				latitude: z.number().describe('Latitude of the location in decimal degrees'),
				longitude: z.number().describe('Longitude of the location in decimal degrees'),
				name: z.string().optional().describe('Name of the location (e.g. business name)'),
				address: z.string().optional().describe('Address of the location'),
			}),
		},

		// ── Contact Messages ──────────────────────────────────────────────────────

		{
			handle: 'sendContactMessage',
			description: 'Send one or more contact cards to a WhatsApp user.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'contacts',
				contacts: '{{ input.contacts }}',
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				contacts: z.array(z.record(z.unknown())).describe('Array of contact objects following the WhatsApp contacts schema'),
			}),
		},

		// ── Reactions ─────────────────────────────────────────────────────────────

		{
			handle: 'sendReaction',
			description: 'Send an emoji reaction to a specific message in a WhatsApp conversation.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				recipient_type: 'individual',
				to: '{{ input.to }}',
				type: 'reaction',
				reaction: {
					message_id: '{{ input.messageId }}',
					emoji: '{{ input.emoji }}',
				},
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				to: z.string().describe('Recipient phone number in E.164 format'),
				messageId: z.string().describe('WhatsApp message ID of the message to react to'),
				emoji: z.string().describe('Emoji character to react with. Pass empty string to remove an existing reaction'),
			}),
		},

		// ── Read Receipts ─────────────────────────────────────────────────────────

		{
			handle: 'markMessageRead',
			description: 'Mark a received WhatsApp message as read, triggering the blue double-tick on the sender\'s side.',
			scopes: ['messages'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/messages',
			body: {
				messaging_product: 'whatsapp',
				status: 'read',
				message_id: '{{ input.messageId }}',
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				messageId: z.string().describe('ID of the received message to mark as read'),
			}),
		},

		// ── Media ─────────────────────────────────────────────────────────────────

		{
			handle: 'uploadMedia',
			description: 'Download media from a URL and upload it to WhatsApp Business servers. Returns a media ID for use in subsequent message sends.',
			scopes: ['media'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const apiKey = context.config?.apiKey as string;
				if (!apiKey) throw new Error('WhatsApp API key (config.apiKey) is required');

				const mediaUrl = input.mediaUrl as string;
				const mimeType = input.mimeType as string;
				const phoneNumberId = input.phoneNumberId as string;

				// Download the media
				const mediaResponse = await fetch(mediaUrl);
				if (!mediaResponse.ok) {
					throw new Error(`Failed to download media from URL: ${mediaResponse.status} ${mediaResponse.statusText}`);
				}
				const mediaBlob = await mediaResponse.blob();

				// Upload to WhatsApp
				const formData = new FormData();
				formData.append('messaging_product', 'whatsapp');
				formData.append('file', mediaBlob, 'upload');
				formData.append('type', mimeType);

				const uploadResponse = await fetch(
					`https://graph.facebook.com/v20.0/${phoneNumberId}/media`,
					{
						method: 'POST',
						headers: {
							Authorization: `Bearer ${apiKey}`,
						},
						body: formData,
					}
				);

				if (!uploadResponse.ok) {
					const error = await uploadResponse.text();
					throw new Error(`WhatsApp media upload failed: ${uploadResponse.status} — ${error}`);
				}

				return uploadResponse.json();
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				mediaUrl: z.string().url().describe('Publicly accessible URL of the media file to download and upload'),
				mimeType: z.string().describe('MIME type of the media file (e.g. "image/jpeg", "video/mp4", "application/pdf")'),
			}),
		},

		{
			handle: 'getMediaUrl',
			description: 'Retrieve the download URL and metadata for a previously uploaded WhatsApp media object using its media ID.',
			scopes: ['media'],
			method: 'GET',
			endpoint: '/{{ input.mediaId }}',
			queryParams: {
				phone_number_id: '{{ input.phoneNumberId }}',
			},
			inputSchema: z.object({
				mediaId: z.string().describe('The WhatsApp media ID to retrieve'),
				phoneNumberId: z.string().optional().describe('Phone number ID associated with the media (may be required for some accounts)'),
			}),
		},

		{
			handle: 'deleteMedia',
			description: 'Permanently delete a media object from WhatsApp servers by its media ID.',
			scopes: ['media'],
			method: 'DELETE',
			endpoint: '/{{ input.mediaId }}',
			queryParams: {
				phone_number_id: '{{ input.phoneNumberId }}',
			},
			inputSchema: z.object({
				mediaId: z.string().describe('The WhatsApp media ID to delete'),
				phoneNumberId: z.string().optional().describe('Phone number ID associated with the media'),
			}),
		},

		// ── Business Profile ──────────────────────────────────────────────────────

		{
			handle: 'getBusinessProfile',
			description: 'Retrieve the WhatsApp Business Profile for a phone number, including about text, address, description, and profile picture URL.',
			scopes: ['profile'],
			method: 'GET',
			endpoint: '/{{ input.phoneNumberId }}/whatsapp_business_profile',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				fields: z.string().optional().describe('Comma-separated list of fields to return (e.g. "about,address,description,email,profile_picture_url,websites,vertical")'),
			}),
		},

		{
			handle: 'updateBusinessProfile',
			description: 'Update the WhatsApp Business Profile fields such as about text, address, description, email, websites, and vertical.',
			scopes: ['profile'],
			method: 'POST',
			endpoint: '/{{ input.phoneNumberId }}/whatsapp_business_profile',
			body: {
				messaging_product: 'whatsapp',
				about: '{{ input.about }}',
				address: '{{ input.address }}',
				description: '{{ input.description }}',
				email: '{{ input.email }}',
				profile_picture_url: '{{ input.profilePictureUrl }}',
				websites: '{{ input.websites }}',
				vertical: '{{ input.vertical }}',
			},
			inputSchema: z.object({
				phoneNumberId: z.string().describe('WhatsApp Business phone number ID'),
				about: z.string().max(139).optional().describe('Business about text shown in the WhatsApp profile (max 139 characters)'),
				address: z.string().max(256).optional().describe('Business address (max 256 characters)'),
				description: z.string().max(512).optional().describe('Business description (max 512 characters)'),
				email: z.string().email().optional().describe('Business contact email address'),
				profilePictureUrl: z.string().url().optional().describe('Publicly accessible HTTPS URL for the new profile picture'),
				websites: z.array(z.string().url()).max(2).optional().describe('Array of up to 2 business website URLs'),
				vertical: z.string().optional().describe('Business vertical / industry (e.g. "EDUCATION", "RETAIL", "TECH")'),
			}),
		},
	],
};
