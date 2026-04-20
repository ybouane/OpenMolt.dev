/**
 * @module integrations/notion
 * Notion REST API v1 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const notionDefinition: IntegrationDefinition = {
	name: 'Notion',
	instructions: `
### Access is explicit
The bot integration can only touch pages & databases that have been **shared with it** inside Notion. A 404 usually means "object exists but isn't shared with this integration" — surface that rather than retrying.

### IDs are UUIDs
Page / database / block / user IDs are UUIDs (with or without hyphens). Both forms are accepted; use what the API returns verbatim.

### Everything is a block
Notion's content model is a recursive **block tree**. A page's content is its children blocks, reached via \`getBlockChildren\` with the page ID as \`block_id\`. Each block has a \`type\` (\`paragraph\`, \`heading_1\`, \`bulleted_list_item\`, \`to_do\`, \`code\`, \`image\`, \`toggle\`, …) whose payload lives under a key matching that type.

### Rich text shape (used everywhere)
Almost all text fields take a \`rich_text\` array of segments, not plain strings:
\`\`\`json
[{ "type": "text", "text": { "content": "Hello " } },
 { "type": "text", "text": { "content": "world", "link": { "url": "https://example.com" } }, "annotations": { "bold": true } }]
\`\`\`
For simple text, a single segment is fine: \`[{ "type": "text", "text": { "content": "…" } }]\`. You cannot pass a bare string.

### Page vs database page
- \`createPage\` with \`parent: { "page_id": "..." }\` → normal page, takes \`properties.title\` and \`children\` blocks.
- \`createPage\` with \`parent: { "database_id": "..." }\` → row in a database; \`properties\` must match the database schema exactly (case-sensitive property names, correct type shape).

Check the schema with \`getDatabase\` before creating rows. Each property type has its own shape, e.g.:
- Title: \`{ "Name": { "title": [{ "type": "text", "text": { "content": "Foo" } }] } }\`
- Select: \`{ "Status": { "select": { "name": "In Progress" } } }\`
- Multi-select: \`{ "Tags": { "multi_select": [{ "name": "urgent" }] } }\`
- Number: \`{ "Budget": { "number": 1000 } }\`
- Date: \`{ "Due": { "date": { "start": "2026-04-30" } } }\`
- Relation: \`{ "Project": { "relation": [{ "id": "<page-id>" }] } }\`
- People: \`{ "Owner": { "people": [{ "id": "<user-id>" }] } }\`

### Querying databases
\`queryDatabase\` supports \`filter\` (compound with \`and\` / \`or\`) and \`sorts\`. Example:
\`\`\`json
{
  "filter": { "and": [
    { "property": "Status", "select": { "equals": "In Progress" } },
    { "property": "Due", "date": { "past_week": {} } }
  ]},
  "sorts": [{ "property": "Due", "direction": "ascending" }]
}
\`\`\`

### Appending content to a page
Use \`appendBlockChildren\` with the page (or parent block) ID and a \`children\` array of block objects. Each block is \`{ "object": "block", "type": "paragraph", "paragraph": { "rich_text": [...] } }\` etc. You cannot insert into the middle — appending always lands at the end of the target.

### Updating vs archiving
\`updatePage\` with \`archived: true\` moves a page to trash (recoverable). \`deleteBlock\` is permanent for blocks. There is no hard-delete for pages via the API.

### Pagination
List endpoints return \`has_more\` and \`next_cursor\`. Pass \`start_cursor\` on the next call. Default \`page_size\` is 100 (max).
`,
	apiSetup: {
		baseUrl: 'https://api.notion.com/v1',
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			'Notion-Version': '2022-06-28',
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
		read: 'Read pages, databases, blocks, and users',
		write: 'Create and update pages, databases, and blocks',
		users: 'Read workspace users and bot info',
	},
	tools: [
		// ── Search ──────────────────────────────────────────────────────────────

		{
			handle: 'searchPages',
			description: 'Search all pages and databases in the workspace. Supports filtering by object type and sorting by last edited or created time.',
			scopes: ['read'],
			method: 'POST',
			endpoint: '/search',
			body: {
				query: '{{ input.query }}',
				filter: '{{ input.filter }}',
				sort: '{{ input.sort }}',
				page_size: '{{ input.page_size }}',
				start_cursor: '{{ input.start_cursor }}',
			},
			inputSchema: z.object({
				query: z.string().describe('Text to search for across page and database titles'),
				filter: z.object({
					value: z.enum(['page', 'database']).describe('Filter results to only pages or only databases'),
					property: z.enum(['object']).describe('The property to filter on (always "object")'),
				}).optional().describe('Filter results to a specific object type'),
				sort: z.object({
					direction: z.enum(['ascending', 'descending']).describe('Sort direction'),
					timestamp: z.enum(['last_edited_time', 'created_time']).describe('Timestamp field to sort by'),
				}).optional().describe('Sort order for results'),
				page_size: z.number().int().min(1).max(100).optional().describe('Number of results to return (max 100)'),
				start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
			}),
			outputSchema: z.object({
				object: z.literal('list'),
				results: z.array(z.record(z.unknown())),
				next_cursor: z.string().nullable(),
				has_more: z.boolean(),
			}),
		},

		// ── Pages ────────────────────────────────────────────────────────────────

		{
			handle: 'getPage',
			description: 'Retrieve a Notion page by its ID, including all property values.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/pages/{{ input.page_id }}',
			inputSchema: z.object({
				page_id: z.string().describe('The ID of the page to retrieve'),
			}),
			outputSchema: z.object({
				object: z.literal('page'),
				id: z.string(),
				created_time: z.string(),
				last_edited_time: z.string(),
				parent: z.record(z.unknown()),
				properties: z.record(z.unknown()),
				archived: z.boolean(),
			}),
		},

		{
			handle: 'createPage',
			description: 'Create a new page inside an existing page or database.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/pages',
			body: {
				parent: '{{ input.parent }}',
				properties: '{{ input.properties }}',
				children: '{{ input.children }}',
				icon: '{{ input.icon }}',
				cover: '{{ input.cover }}',
			},
			inputSchema: z.object({
				parent: z.record(z.unknown()).describe('The parent page or database. Use {database_id: "..."} or {page_id: "..."}'),
				properties: z.record(z.unknown()).describe('Page property values. Must conform to the parent database schema if parent is a database'),
				children: z.array(z.record(z.unknown())).optional().describe('Array of block objects to append as children of the new page'),
				icon: z.record(z.unknown()).optional().describe('Page icon — an emoji object or external file object'),
				cover: z.record(z.unknown()).optional().describe('Page cover image — an external file object'),
			}),
			outputSchema: z.object({
				object: z.literal('page'),
				id: z.string(),
				parent: z.record(z.unknown()),
				properties: z.record(z.unknown()),
			}),
		},

		{
			handle: 'updatePage',
			description: 'Update property values, archived status, icon, or cover of an existing page.',
			scopes: ['write'],
			method: 'PATCH',
			endpoint: '/pages/{{ input.page_id }}',
			body: {
				properties: '{{ input.properties }}',
				archived: '{{ input.archived }}',
				icon: '{{ input.icon }}',
				cover: '{{ input.cover }}',
			},
			inputSchema: z.object({
				page_id: z.string().describe('The ID of the page to update'),
				properties: z.record(z.unknown()).optional().describe('Page property values to update'),
				archived: z.boolean().optional().describe('Set to true to archive (trash) the page'),
				icon: z.record(z.unknown()).optional().describe('New page icon — an emoji object or external file object'),
				cover: z.record(z.unknown()).optional().describe('New page cover — an external file object'),
			}),
			outputSchema: z.object({
				object: z.literal('page'),
				id: z.string(),
				archived: z.boolean(),
				properties: z.record(z.unknown()),
			}),
		},

		// ── Databases ────────────────────────────────────────────────────────────

		{
			handle: 'getDatabase',
			description: 'Retrieve a Notion database by its ID, including its schema (properties).',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/databases/{{ input.database_id }}',
			inputSchema: z.object({
				database_id: z.string().describe('The ID of the database to retrieve'),
			}),
			outputSchema: z.object({
				object: z.literal('database'),
				id: z.string(),
				title: z.array(z.record(z.unknown())),
				properties: z.record(z.unknown()),
				created_time: z.string(),
				last_edited_time: z.string(),
			}),
		},

		{
			handle: 'queryDatabase',
			description: 'Query a database with optional filters and sorts. Returns a paginated list of pages in the database.',
			scopes: ['read'],
			method: 'POST',
			endpoint: '/databases/{{ input.database_id }}/query',
			body: {
				filter: '{{ input.filter }}',
				sorts: '{{ input.sorts }}',
				page_size: '{{ input.page_size }}',
				start_cursor: '{{ input.start_cursor }}',
			},
			inputSchema: z.object({
				database_id: z.string().describe('The ID of the database to query'),
				filter: z.record(z.unknown()).optional().describe('A filter object to narrow results. See Notion filter docs.'),
				sorts: z.array(z.record(z.unknown())).optional().describe('Array of sort criteria'),
				page_size: z.number().int().min(1).max(100).optional().describe('Number of results per page (max 100)'),
				start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
			}),
			outputSchema: z.object({
				object: z.literal('list'),
				results: z.array(z.record(z.unknown())),
				next_cursor: z.string().nullable(),
				has_more: z.boolean(),
			}),
		},

		{
			handle: 'createDatabase',
			description: 'Create a new database as a child of an existing page.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/databases',
			body: {
				parent: '{{ input.parent }}',
				title: '{{ input.title }}',
				properties: '{{ input.properties }}',
				icon: '{{ input.icon }}',
				cover: '{{ input.cover }}',
			},
			inputSchema: z.object({
				parent: z.record(z.unknown()).describe('The parent page. Use {page_id: "..."}'),
				title: z.array(z.record(z.unknown())).describe('Rich text array representing the database title'),
				properties: z.record(z.unknown()).describe('Schema of the database — keys are property names, values are property schema objects'),
				icon: z.record(z.unknown()).optional().describe('Database icon — an emoji object or external file object'),
				cover: z.record(z.unknown()).optional().describe('Database cover image — an external file object'),
			}),
			outputSchema: z.object({
				object: z.literal('database'),
				id: z.string(),
				title: z.array(z.record(z.unknown())),
				properties: z.record(z.unknown()),
			}),
		},

		// ── Blocks ───────────────────────────────────────────────────────────────

		{
			handle: 'getBlock',
			description: 'Retrieve a single block by its ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/blocks/{{ input.block_id }}',
			inputSchema: z.object({
				block_id: z.string().describe('The ID of the block to retrieve'),
			}),
			outputSchema: z.object({
				object: z.literal('block'),
				id: z.string(),
				type: z.string(),
				has_children: z.boolean(),
			}),
		},

		{
			handle: 'getBlockChildren',
			description: 'Retrieve the children of a block or page. Returns a paginated list of block objects.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/blocks/{{ input.block_id }}/children',
			queryParams: {
				page_size: '{{ input.page_size }}',
				start_cursor: '{{ input.start_cursor }}',
			},
			inputSchema: z.object({
				block_id: z.string().describe('The ID of the block or page whose children to retrieve'),
				page_size: z.number().int().min(1).max(100).optional().describe('Number of results per page (max 100)'),
				start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
			}),
			outputSchema: z.object({
				object: z.literal('list'),
				results: z.array(z.record(z.unknown())),
				next_cursor: z.string().nullable(),
				has_more: z.boolean(),
			}),
		},

		{
			handle: 'appendBlockChildren',
			description: 'Append new children blocks to an existing block or page.',
			scopes: ['write'],
			method: 'PATCH',
			endpoint: '/blocks/{{ input.block_id }}/children',
			body: {
				children: '{{ input.children }}',
			},
			inputSchema: z.object({
				block_id: z.string().describe('The ID of the block or page to append children to'),
				children: z.array(z.record(z.unknown())).describe('Array of block objects to append'),
			}),
			outputSchema: z.object({
				object: z.literal('list'),
				results: z.array(z.record(z.unknown())),
			}),
		},

		{
			handle: 'updateBlock',
			description: 'Update the content or properties of an existing block. Pass the block type and its content object.',
			scopes: ['write'],
			method: 'PATCH',
			endpoint: '/blocks/{{ input.block_id }}',
			body: {
				type: '{{ input.type }}',
				archived: '{{ input.archived }}',
				paragraph: '{{ input.paragraph }}',
				heading_1: '{{ input.heading_1 }}',
				heading_2: '{{ input.heading_2 }}',
				heading_3: '{{ input.heading_3 }}',
				bulleted_list_item: '{{ input.bulleted_list_item }}',
				numbered_list_item: '{{ input.numbered_list_item }}',
				to_do: '{{ input.to_do }}',
				toggle: '{{ input.toggle }}',
				code: '{{ input.code }}',
				quote: '{{ input.quote }}',
				callout: '{{ input.callout }}',
				embed: '{{ input.embed }}',
				image: '{{ input.image }}',
				video: '{{ input.video }}',
				file: '{{ input.file }}',
				bookmark: '{{ input.bookmark }}',
				divider: '{{ input.divider }}',
				table_row: '{{ input.table_row }}',
			},
			inputSchema: z.object({
				block_id: z.string().describe('The ID of the block to update'),
				archived: z.boolean().optional().describe('Set to true to archive (delete) the block'),
				type: z.string().optional().describe('Block type (e.g. "paragraph", "heading_1", "to_do")'),
				paragraph: z.record(z.unknown()).optional(),
				heading_1: z.record(z.unknown()).optional(),
				heading_2: z.record(z.unknown()).optional(),
				heading_3: z.record(z.unknown()).optional(),
				bulleted_list_item: z.record(z.unknown()).optional(),
				numbered_list_item: z.record(z.unknown()).optional(),
				to_do: z.record(z.unknown()).optional(),
				toggle: z.record(z.unknown()).optional(),
				code: z.record(z.unknown()).optional(),
				quote: z.record(z.unknown()).optional(),
				callout: z.record(z.unknown()).optional(),
				embed: z.record(z.unknown()).optional(),
				image: z.record(z.unknown()).optional(),
				video: z.record(z.unknown()).optional(),
				file: z.record(z.unknown()).optional(),
				bookmark: z.record(z.unknown()).optional(),
				divider: z.record(z.unknown()).optional(),
				table_row: z.record(z.unknown()).optional(),
			}),
			outputSchema: z.object({
				object: z.literal('block'),
				id: z.string(),
				type: z.string(),
			}),
		},

		{
			handle: 'deleteBlock',
			description: 'Delete (archive) a block by its ID. This is a soft delete — the block is archived and can be restored.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/blocks/{{ input.block_id }}',
			inputSchema: z.object({
				block_id: z.string().describe('The ID of the block to delete'),
			}),
			outputSchema: z.object({
				object: z.literal('block'),
				id: z.string(),
				archived: z.boolean(),
			}),
		},

		// ── Users ────────────────────────────────────────────────────────────────

		{
			handle: 'listUsers',
			description: 'List all users in the workspace. Requires the integration to have user read permissions.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users',
			queryParams: {
				page_size: '{{ input.page_size }}',
				start_cursor: '{{ input.start_cursor }}',
			},
			inputSchema: z.object({
				page_size: z.number().int().min(1).max(100).optional().describe('Number of users to return per page (max 100)'),
				start_cursor: z.string().optional().describe('Pagination cursor from a previous response'),
			}),
			outputSchema: z.object({
				object: z.literal('list'),
				results: z.array(z.object({
					object: z.literal('user'),
					id: z.string(),
					type: z.string(),
					name: z.string().nullable(),
					avatar_url: z.string().nullable(),
				})),
				next_cursor: z.string().nullable(),
				has_more: z.boolean(),
			}),
		},

		{
			handle: 'getUser',
			description: 'Retrieve a specific user by their ID.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users/{{ input.user_id }}',
			inputSchema: z.object({
				user_id: z.string().describe('The ID of the user to retrieve'),
			}),
			outputSchema: z.object({
				object: z.literal('user'),
				id: z.string(),
				type: z.string(),
				name: z.string().nullable(),
				avatar_url: z.string().nullable(),
			}),
		},

		{
			handle: 'getMe',
			description: 'Retrieve the bot user associated with the current integration token.',
			scopes: ['users'],
			method: 'GET',
			endpoint: '/users/me',
			inputSchema: z.object({}),
			outputSchema: z.object({
				object: z.literal('user'),
				id: z.string(),
				type: z.literal('bot'),
				name: z.string().nullable(),
				avatar_url: z.string().nullable(),
				bot: z.record(z.unknown()),
			}),
		},
	],
};
