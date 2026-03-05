import { z } from 'zod';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

export const googleDriveDefinition: IntegrationDefinition = {
	name: 'Google Drive',
	apiSetup: {
		baseUrl: 'https://www.googleapis.com/drive/v3',
		headers: {
			'Content-Type': 'application/json',
		},
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
				'https://www.googleapis.com/auth/drive',
				'https://www.googleapis.com/auth/drive.file',
			],
		},
	],
	scopes: {
		read: 'Read files and folders',
		write: 'Create and modify files and folders',
		files: 'Access file content and metadata',
		permissions: 'Manage file permissions and sharing',
		drives: 'Access and manage shared drives',
	},
	tools: [
		{
			handle: 'listFiles',
			description: 'List files and folders in Google Drive',
			scopes: ['read', 'files'],
			method: 'GET',
			endpoint: '/files',
			queryParams: {
				q: '{{ input.q }}',
				pageSize: '{{ input.pageSize }}',
				pageToken: '{{ input.pageToken }}',
				orderBy: '{{ input.orderBy }}',
				fields: '{{ input.fields }}',
				spaces: '{{ input.spaces }}',
				driveId: '{{ input.driveId }}',
				includeItemsFromAllDrives: '{{ input.includeItemsFromAllDrives }}',
				supportsAllDrives: '{{ input.supportsAllDrives }}',
			},
			inputSchema: z.object({
				q: z.string().optional().describe('Query string for filtering files'),
				pageSize: z.number().int().min(1).max(1000).optional().describe('Maximum number of files to return'),
				pageToken: z.string().optional().describe('Page token for continuing a previous list request'),
				orderBy: z.string().optional().describe('Sort order for the results'),
				fields: z.string().optional().describe('Fields to include in the response'),
				spaces: z.string().optional().describe('Comma-separated list of spaces to query'),
				driveId: z.string().optional().describe('ID of the shared drive to search'),
				includeItemsFromAllDrives: z.boolean().optional().describe('Whether to include items from all drives'),
				supportsAllDrives: z.boolean().optional().describe('Whether the application supports shared drives'),
			}),
			outputSchema: z.object({
				nextPageToken: z.string().optional(),
				files: z.array(z.object({
					id: z.string(),
					name: z.string(),
					mimeType: z.string(),
					parents: z.array(z.string()).optional(),
					createdTime: z.string().optional(),
					modifiedTime: z.string().optional(),
					size: z.string().optional(),
				})),
			}),
		},
		{
			handle: 'getFile',
			description: 'Get metadata for a specific file or folder',
			scopes: ['read', 'files'],
			method: 'GET',
			endpoint: '/files/{{ input.fileId }}',
			queryParams: {
				fields: '{{ input.fields }}',
				supportsAllDrives: '{{ input.supportsAllDrives }}',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to retrieve'),
				fields: z.string().optional().describe('Fields to include in the response'),
				supportsAllDrives: z.boolean().optional().describe('Whether the application supports shared drives'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				mimeType: z.string(),
				parents: z.array(z.string()).optional(),
				createdTime: z.string().optional(),
				modifiedTime: z.string().optional(),
				size: z.string().optional(),
				webViewLink: z.string().optional(),
				description: z.string().optional(),
			}),
		},
		{
			handle: 'createFolder',
			description: 'Create a new folder in Google Drive',
			scopes: ['write', 'files'],
			method: 'POST',
			endpoint: '/files',
			queryParams: {
				supportsAllDrives: 'true',
			},
			body: {
				name: '{{ input.name }}',
				mimeType: 'application/vnd.google-apps.folder',
				parents: '{{ input.parentIds }}',
			},
			inputSchema: z.object({
				name: z.string().describe('Name of the folder to create'),
				parentIds: z.array(z.string()).optional().describe('IDs of parent folders (wrap a single parentId in an array)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				mimeType: z.string(),
				parents: z.array(z.string()).optional(),
				createdTime: z.string().optional(),
			}),
		},
		{
			handle: 'copyFile',
			description: 'Copy a file to a new location in Google Drive',
			scopes: ['write', 'files'],
			method: 'POST',
			endpoint: '/files/{{ input.fileId }}/copy',
			queryParams: {
				supportsAllDrives: 'true',
			},
			body: {
				name: '{{ input.name }}',
				parents: ['{{ input.parentId }}'],
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to copy'),
				name: z.string().optional().describe('Name for the copied file'),
				parentId: z.string().optional().describe('ID of the destination parent folder'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				mimeType: z.string(),
				parents: z.array(z.string()).optional(),
				createdTime: z.string().optional(),
			}),
		},
		{
			handle: 'deleteFile',
			description: 'Permanently delete a file or folder from Google Drive',
			scopes: ['write', 'files'],
			method: 'DELETE',
			endpoint: '/files/{{ input.fileId }}',
			queryParams: {
				supportsAllDrives: '{{ input.supportsAllDrives }}',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file or folder to delete'),
				supportsAllDrives: z.boolean().optional().describe('Whether the application supports shared drives'),
			}),
		},
		{
			handle: 'updateFile',
			description: 'Update metadata for a file or folder in Google Drive',
			scopes: ['write', 'files'],
			method: 'PATCH',
			endpoint: '/files/{{ input.fileId }}',
			queryParams: {
				supportsAllDrives: 'true',
			},
			body: {
				name: '{{ input.name }}',
				description: '{{ input.description }}',
				starred: '{{ input.starred }}',
				trashed: '{{ input.trashed }}',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to update'),
				name: z.string().optional().describe('New name for the file'),
				description: z.string().optional().describe('New description for the file'),
				starred: z.boolean().optional().describe('Whether to star the file'),
				trashed: z.boolean().optional().describe('Whether to move the file to the trash'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				mimeType: z.string(),
				modifiedTime: z.string().optional(),
				starred: z.boolean().optional(),
				trashed: z.boolean().optional(),
			}),
		},
		{
			handle: 'moveFile',
			description: 'Move a file to a different folder in Google Drive. Use getFile to find the current parentId if unknown.',
			scopes: ['write', 'files'],
			method: 'PATCH',
			endpoint: '/files/{{ input.fileId }}',
			queryParams: {
				addParents: '{{ input.newParentId }}',
				removeParents: '{{ input.oldParentId }}',
				supportsAllDrives: 'true',
			},
			body: {},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to move'),
				newParentId: z.string().describe('ID of the destination parent folder'),
				oldParentId: z.string().optional().describe('ID of the current parent folder to remove (use getFile to find it; omitting may create a second location instead of moving)'),
			}),
			outputSchema: z.object({
				id: z.string(),
				name: z.string(),
				mimeType: z.string(),
				parents: z.array(z.string()).optional(),
			}),
		},
		{
			handle: 'searchFiles',
			description: 'Search for files and folders in Google Drive using a query string',
			scopes: ['read', 'files'],
			method: 'GET',
			endpoint: '/files',
			queryParams: {
				q: '{{ input.query }}',
				pageSize: '{{ input.pageSize }}',
				pageToken: '{{ input.pageToken }}',
				fields: '{{ input.fields }}',
				driveId: '{{ input.driveId }}',
				includeItemsFromAllDrives: 'true',
				supportsAllDrives: 'true',
			},
			inputSchema: z.object({
				query: z.string().describe('Google Drive query string (e.g. "name contains \'report\'")')	,
				pageSize: z.number().int().min(1).max(1000).optional().describe('Maximum number of results'),
				pageToken: z.string().optional().describe('Page token for pagination'),
				fields: z.string().optional().describe('Fields to include in the response'),
				driveId: z.string().optional().describe('ID of the shared drive to search in'),
			}),
			outputSchema: z.object({
				nextPageToken: z.string().optional(),
				files: z.array(z.object({
					id: z.string(),
					name: z.string(),
					mimeType: z.string(),
					parents: z.array(z.string()).optional(),
					modifiedTime: z.string().optional(),
				})),
			}),
		},
		{
			handle: 'getFilePermissions',
			description: 'List all permissions for a file or folder',
			scopes: ['read', 'permissions'],
			method: 'GET',
			endpoint: '/files/{{ input.fileId }}/permissions',
			queryParams: {
				fields: 'permissions(id,type,role,emailAddress,domain,displayName)',
				supportsAllDrives: 'true',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to list permissions for'),
			}),
			outputSchema: z.object({
				permissions: z.array(z.object({
					id: z.string(),
					type: z.string(),
					role: z.string(),
					emailAddress: z.string().optional(),
					domain: z.string().optional(),
					displayName: z.string().optional(),
				})),
			}),
		},
		{
			handle: 'createPermission',
			description: 'Create a sharing permission for a file or folder',
			scopes: ['write', 'permissions'],
			method: 'POST',
			endpoint: '/files/{{ input.fileId }}/permissions',
			queryParams: {
				sendNotificationEmail: '{{ input.sendNotificationEmail }}',
				supportsAllDrives: 'true',
			},
			body: {
				role: '{{ input.role }}',
				type: '{{ input.type }}',
				emailAddress: '{{ input.emailAddress }}',
				domain: '{{ input.domain }}',
				allowFileDiscovery: '{{ input.allowFileDiscovery }}',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to create a permission for'),
				role: z.enum(['owner', 'organizer', 'fileOrganizer', 'writer', 'commenter', 'reader']).describe('The role granted by this permission'),
				type: z.enum(['user', 'group', 'domain', 'anyone']).describe('The type of the grantee'),
				emailAddress: z.string().email().optional().describe('Email address of the user or group (required for user/group types)'),
				domain: z.string().optional().describe('Domain name (required for domain type)'),
				allowFileDiscovery: z.boolean().optional().describe('Whether the file can be discovered through search (for domain/anyone types)'),
				sendNotificationEmail: z.boolean().optional().describe('Whether to send a notification email'),
			}),
			outputSchema: z.object({
				id: z.string(),
				type: z.string(),
				role: z.string(),
				emailAddress: z.string().optional(),
				domain: z.string().optional(),
			}),
		},
		{
			handle: 'deletePermission',
			description: 'Remove a sharing permission from a file or folder',
			scopes: ['write', 'permissions'],
			method: 'DELETE',
			endpoint: '/files/{{ input.fileId }}/permissions/{{ input.permissionId }}',
			queryParams: {
				supportsAllDrives: 'true',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file'),
				permissionId: z.string().describe('The ID of the permission to delete'),
			}),
		},
		{
			handle: 'exportFile',
			description: 'Export a Google Workspace file (Doc, Sheet, Slide, etc.) to a different format',
			scopes: ['read', 'files'],
			method: 'GET',
			endpoint: '/files/{{ input.fileId }}/export',
			queryParams: {
				mimeType: '{{ input.mimeType }}',
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the Google Workspace file to export'),
				mimeType: z.string().describe('The MIME type of the format to export to (e.g. application/pdf, text/plain, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)'),
			}),
		},
		{
			handle: 'downloadFile',
			description: 'Download the binary content of a file from Google Drive',
			scopes: ['read', 'files'],
			execute: async (input: Record<string, unknown>, context: ToolContext): Promise<unknown> => {
				const config = context.config as Record<string, unknown>;
				const accessToken = config?.accessToken as string;
				const fileId = input.fileId as string;

				const response = await fetch(
					`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`,
					{
						headers: { 'Authorization': `Bearer ${accessToken}` },
					},
				);

				if (!response.ok) {
					const error = await response.text();
					throw new Error(`Failed to download file: ${error}`);
				}

				const contentType = response.headers.get('content-type') ?? 'application/octet-stream';
				const isText = contentType.startsWith('text/') || contentType.includes('json') || contentType.includes('xml');

				if (isText) {
					const text = await response.text();
					return { content: text, mimeType: contentType, encoding: 'utf-8' };
				}

				const buffer = await response.arrayBuffer();
				const base64 = Buffer.from(buffer).toString('base64');
				return { content: base64, mimeType: contentType, encoding: 'base64' };
			},
			inputSchema: z.object({
				fileId: z.string().describe('The ID of the file to download'),
			}),
			outputSchema: z.object({
				content: z.string().describe('File content as UTF-8 text or base64-encoded string'),
				mimeType: z.string(),
				encoding: z.enum(['utf-8', 'base64']),
			}),
		},
		{
			handle: 'getStorageQuota',
			description: 'Get information about the user\'s Google Drive storage quota',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/about',
			queryParams: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				fields: z.string().optional().describe('Fields to return (defaults to storageQuota)'),
			}),
			outputSchema: z.object({
				storageQuota: z.object({
					limit: z.string().optional(),
					usageInDrive: z.string().optional(),
					usageInDriveTrash: z.string().optional(),
					usage: z.string().optional(),
				}).optional(),
			}),
		},
		{
			handle: 'listDrives',
			description: 'List the shared drives accessible to the user',
			scopes: ['read', 'drives'],
			method: 'GET',
			endpoint: '/drives',
			queryParams: {
				pageSize: '{{ input.pageSize }}',
				pageToken: '{{ input.pageToken }}',
				q: '{{ input.q }}',
				useDomainAdminAccess: '{{ input.useDomainAdminAccess }}',
			},
			inputSchema: z.object({
				pageSize: z.number().int().min(1).max(100).optional().describe('Maximum number of shared drives to return'),
				pageToken: z.string().optional().describe('Page token for pagination'),
				q: z.string().optional().describe('Query string to filter shared drives'),
				useDomainAdminAccess: z.boolean().optional().describe('Issue the request as a domain administrator'),
			}),
			outputSchema: z.object({
				nextPageToken: z.string().optional(),
				drives: z.array(z.object({
					id: z.string(),
					name: z.string(),
					kind: z.string().optional(),
					createdTime: z.string().optional(),
				})),
			}),
		},
	],
};
