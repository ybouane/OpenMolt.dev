/**
 * @module integrations/dropbox
 * Dropbox API v2 integration definition.
 *
 * Most Dropbox endpoints use POST with a JSON body to api.dropboxapi.com.
 * Upload and download operations target content.dropboxapi.com.
 */

import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

const DROPBOX_API_BASE = 'https://api.dropboxapi.com/2';
const DROPBOX_CONTENT_BASE = 'https://content.dropboxapi.com/2';

function dropboxHeaders(context: ToolContext, extra?: Record<string, string>): Record<string, string> {
	const config = context.config ?? {};
	return {
		Authorization: `Bearer ${config.apiKey ?? ''}`,
		'Content-Type': 'application/json',
		...extra,
	};
}

export const dropboxDefinition: IntegrationDefinition = {
	name: 'Dropbox',
	apiSetup: {
		baseUrl: DROPBOX_API_BASE,
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
		'files.read': 'Read file and folder metadata and content',
		'files.write': 'Create, move, copy, and delete files and folders',
		sharing: 'Manage shared links and folder sharing',
		account: 'Read account and space usage information',
	},
	tools: [
		// ── File Operations ───────────────────────────────────────────────────────

		{
			handle: 'listFolder',
			description: 'List the contents of a Dropbox folder. Use an empty string for the root.',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/list_folder',
			body: {
				path: '{{ input.path }}',
				recursive: '{{ input.recursive }}',
				include_media_info: '{{ input.include_media_info }}',
				include_deleted: '{{ input.include_deleted }}',
				include_has_explicit_shared_members: '{{ input.include_has_explicit_shared_members }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Path to the folder (use "" for root)'),
				recursive: z.boolean().optional().describe('Recursively list all subfolders'),
				include_media_info: z.boolean().optional().describe('Include photo and video metadata'),
				include_deleted: z.boolean().optional().describe('Include deleted files and folders'),
				include_has_explicit_shared_members: z.boolean().optional().describe('Include shared member info'),
				limit: z.number().int().min(1).max(2000).optional().describe('Maximum number of results per page'),
			}),
		},

		{
			handle: 'listFolderContinue',
			description: 'Continue listing folder contents using a cursor from a previous listFolder call.',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/list_folder/continue',
			body: {
				cursor: '{{ input.cursor }}',
			},
			inputSchema: z.object({
				cursor: z.string().describe('Cursor returned from a previous listFolder or listFolderContinue call'),
			}),
		},

		{
			handle: 'getMetadata',
			description: 'Get file or folder metadata for a path in Dropbox.',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/get_metadata',
			body: {
				path: '{{ input.path }}',
				include_media_info: '{{ input.include_media_info }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Path to the file or folder'),
				include_media_info: z.boolean().optional().describe('Include photo and video metadata'),
			}),
		},

		{
			handle: 'createFolder',
			description: 'Create a new folder in Dropbox.',
			scopes: ['files.write'],
			method: 'POST',
			endpoint: '/files/create_folder_v2',
			body: {
				path: '{{ input.path }}',
				autorename: '{{ input.autorename }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Path of the folder to create (e.g. "/Documents/NewFolder")'),
				autorename: z.boolean().optional().describe('If a conflict exists, rename the folder automatically'),
			}),
		},

		{
			handle: 'deleteFile',
			description: 'Delete a file or folder at the specified Dropbox path.',
			scopes: ['files.write'],
			method: 'POST',
			endpoint: '/files/delete_v2',
			body: {
				path: '{{ input.path }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Path of the file or folder to delete'),
			}),
		},

		{
			handle: 'moveFile',
			description: 'Move a file or folder to a new location in Dropbox.',
			scopes: ['files.write'],
			method: 'POST',
			endpoint: '/files/move_v2',
			body: {
				from_path: '{{ input.from_path }}',
				to_path: '{{ input.to_path }}',
				allow_shared_folder: '{{ input.allow_shared_folder }}',
				autorename: '{{ input.autorename }}',
				allow_ownership_transfer: '{{ input.allow_ownership_transfer }}',
			},
			inputSchema: z.object({
				from_path: z.string().describe('Source path'),
				to_path: z.string().describe('Destination path'),
				allow_shared_folder: z.boolean().optional().describe('Allow moving a shared folder into a shared folder'),
				autorename: z.boolean().optional().describe('Autorename the destination if a conflict exists'),
				allow_ownership_transfer: z.boolean().optional().describe('Allow ownership transfer when moving between namespaces'),
			}),
		},

		{
			handle: 'copyFile',
			description: 'Copy a file or folder to a new location in Dropbox.',
			scopes: ['files.write'],
			method: 'POST',
			endpoint: '/files/copy_v2',
			body: {
				from_path: '{{ input.from_path }}',
				to_path: '{{ input.to_path }}',
				allow_shared_folder: '{{ input.allow_shared_folder }}',
				autorename: '{{ input.autorename }}',
				allow_ownership_transfer: '{{ input.allow_ownership_transfer }}',
			},
			inputSchema: z.object({
				from_path: z.string().describe('Source path to copy from'),
				to_path: z.string().describe('Destination path to copy to'),
				allow_shared_folder: z.boolean().optional().describe('Allow copying a shared folder'),
				autorename: z.boolean().optional().describe('Autorename the destination if a conflict exists'),
				allow_ownership_transfer: z.boolean().optional().describe('Allow ownership transfer'),
			}),
		},

		{
			handle: 'searchFiles',
			description: 'Search for files and folders in Dropbox by keyword.',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/search_v2',
			body: {
				query: '{{ input.query }}',
				options: '{{ input.options }}',
				match_field_options: '{{ input.match_field_options }}',
			},
			inputSchema: z.object({
				query: z.string().describe('Search query string'),
				options: z.record(z.unknown()).optional().describe('Search options (e.g. {path, max_results, file_status, filename_only})'),
				match_field_options: z.record(z.unknown()).optional().describe('Match field options (e.g. {include_highlights})'),
			}),
		},

		// ── Download / Upload (content endpoint) ─────────────────────────────────

		{
			handle: 'downloadFile',
			description: 'Download a file from Dropbox. Returns the file content as base64 for binary files or plain text, along with content type and size.',
			scopes: ['files.read'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config ?? {};
				const path = String(input.path ?? '');
				const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/download`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${config.apiKey ?? ''}`,
						'Dropbox-API-Arg': JSON.stringify({ path }),
					},
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Dropbox downloadFile failed (${response.status}): ${err}`);
				}
				const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
				const apiResult = response.headers.get('dropbox-api-result');
				const metadata = apiResult ? JSON.parse(apiResult) : {};
				const buffer = await response.arrayBuffer();
				const size = buffer.byteLength;
				const isText = contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml');
				const content = isText
					? new TextDecoder().decode(buffer)
					: Buffer.from(buffer).toString('base64');
				return { content, contentType, size, metadata };
			},
			inputSchema: z.object({
				path: z.string().describe('Dropbox path of the file to download'),
			}),
		},

		{
			handle: 'uploadFile',
			description: 'Upload a file to Dropbox. Provide content as base64 for binary files or plain text for text files.',
			scopes: ['files.write'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config ?? {};
				const {
					path,
					content,
					mode = 'add',
					autorename = false,
					mute = false,
					contentType = 'application/octet-stream',
				} = input as {
					path: string;
					content: string;
					mode?: string;
					autorename?: boolean;
					mute?: boolean;
					contentType?: string;
				};

				const isBase64 = /^[A-Za-z0-9+/]+=*$/.test(content) && content.length % 4 === 0;
				const body = isBase64
					? Buffer.from(content, 'base64')
					: Buffer.from(content, 'utf8');

				const dropboxArg = JSON.stringify({ path, mode, autorename, mute, strict_conflict: false });
				const response = await fetch(`${DROPBOX_CONTENT_BASE}/files/upload`, {
					method: 'POST',
					headers: {
						Authorization: `Bearer ${config.apiKey ?? ''}`,
						'Content-Type': contentType,
						'Dropbox-API-Arg': dropboxArg,
					},
					body,
				});
				if (!response.ok) {
					const err = await response.text();
					throw new Error(`Dropbox uploadFile failed (${response.status}): ${err}`);
				}
				return response.json();
			},
			inputSchema: z.object({
				path: z.string().describe('Destination path in Dropbox (e.g. "/Documents/file.txt")'),
				content: z.string().describe('File content — plain text or base64-encoded for binary files'),
				mode: z.enum(['add', 'overwrite', 'update']).optional().describe('Write mode: add (fail on conflict), overwrite, or update (requires rev)'),
				autorename: z.boolean().optional().describe('Automatically rename on conflict (only with mode=add)'),
				mute: z.boolean().optional().describe('Suppress desktop notifications for this upload'),
				contentType: z.string().optional().describe('MIME type of the file (e.g. "text/plain")'),
			}),
		},

		// ── Temporary Links ───────────────────────────────────────────────────────

		{
			handle: 'getTemporaryLink',
			description: 'Get a temporary direct-access link to a file in Dropbox (expires after 4 hours).',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/get_temporary_link',
			body: {
				path: '{{ input.path }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Dropbox path of the file'),
			}),
		},

		// ── Shared Links ──────────────────────────────────────────────────────────

		{
			handle: 'createSharedLink',
			description: 'Create a shared link for a file or folder in Dropbox.',
			scopes: ['sharing'],
			method: 'POST',
			endpoint: '/sharing/create_shared_link_with_settings',
			body: {
				path: '{{ input.path }}',
				settings: '{{ input.settings }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Dropbox path to create the shared link for'),
				settings: z.record(z.unknown()).optional().describe('Link settings (e.g. {requested_visibility, link_password, expires})'),
			}),
		},

		{
			handle: 'listSharedLinks',
			description: 'List shared links for a file, folder, or the entire account.',
			scopes: ['sharing'],
			method: 'POST',
			endpoint: '/sharing/list_shared_links',
			body: {
				path: '{{ input.path }}',
				cursor: '{{ input.cursor }}',
				direct_only: '{{ input.direct_only }}',
			},
			inputSchema: z.object({
				path: z.string().optional().describe('Filter shared links to those pointing to this path'),
				cursor: z.string().optional().describe('Pagination cursor from a previous call'),
				direct_only: z.boolean().optional().describe('Only return links directly pointing to the given path'),
			}),
		},

		{
			handle: 'revokeSharedLink',
			description: 'Revoke a shared link, making it inaccessible.',
			scopes: ['sharing'],
			method: 'POST',
			endpoint: '/sharing/revoke_shared_link',
			body: {
				url: '{{ input.url }}',
			},
			inputSchema: z.object({
				url: z.string().url().describe('The shared link URL to revoke'),
			}),
		},

		// ── Account ───────────────────────────────────────────────────────────────

		{
			handle: 'getSpaceUsage',
			description: 'Get the space usage (used and allocated) for the Dropbox account.',
			scopes: ['account'],
			method: 'POST',
			endpoint: '/users/get_space_usage',
			body: {},
			inputSchema: z.object({}),
		},

		// ── Revisions ────────────────────────────────────────────────────────────

		{
			handle: 'listRevisions',
			description: 'List revisions of a file to get its history.',
			scopes: ['files.read'],
			method: 'POST',
			endpoint: '/files/list_revisions',
			body: {
				path: '{{ input.path }}',
				limit: '{{ input.limit }}',
			},
			inputSchema: z.object({
				path: z.string().describe('Dropbox path of the file to list revisions for'),
				limit: z.number().int().min(1).max(100).optional().describe('Maximum number of revisions to return'),
			}),
		},
	],
};
