/**
 * @module integrations/airtable
 * Airtable REST API v0 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const airtableDefinition: IntegrationDefinition = {
	name: 'Airtable',
	apiSetup: {
		baseUrl: 'https://api.airtable.com/v0',
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
		read: 'Read records, tables, and base schemas',
		write: 'Create, update, and delete records and tables',
		schema: 'Read and modify base and table schemas',
	},
	tools: [
		{
			handle: 'listRecords',
			description: 'List records in an Airtable table with optional filtering, sorting, and pagination.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}',
			queryParams: {
				filterByFormula: '{{ input.filterByFormula }}',
				maxRecords: '{{ input.maxRecords }}',
				pageSize: '{{ input.pageSize }}',
				view: '{{ input.view }}',
				offset: '{{ input.offset }}',
				returnFieldsByFieldId: '{{ input.returnFieldsByFieldId }}',
				'fields[]': '{{ input.fields }}',
				sort: '{{ input.sort }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID (e.g. appXXXXXXXXXXXXXX)'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				filterByFormula: z.string().optional().describe('Airtable formula to filter records'),
				maxRecords: z.number().int().min(1).optional().describe('Maximum total number of records to return'),
				pageSize: z.number().int().min(1).max(100).optional().describe('Number of records per page (max 100)'),
				sort: z.array(z.object({
					field: z.string().describe('Field name to sort by'),
					direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
				})).optional().describe('Array of sort criteria'),
				view: z.string().optional().describe('Name or ID of a view to use'),
				fields: z.array(z.string()).optional().describe('Array of field names to include in records'),
				offset: z.string().optional().describe('Pagination offset from a previous response'),
				returnFieldsByFieldId: z.boolean().optional().describe('Return field IDs instead of field names as keys'),
			}),
		},

		{
			handle: 'getRecord',
			description: 'Retrieve a single record from an Airtable table by its record ID.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}/{{ input.recordId }}',
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				recordId: z.string().describe('The record ID to retrieve (e.g. recXXXXXXXXXXXXXX)'),
			}),
		},

		{
			handle: 'createRecords',
			description: 'Create one or more records in an Airtable table. Supports up to 10 records per request.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}',
			body: {
				records: '{{ input.records }}',
				typecast: '{{ input.typecast }}',
				returnFieldsByFieldId: '{{ input.returnFieldsByFieldId }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				records: z.array(z.object({
					fields: z.record(z.unknown()).describe('Field values for the new record'),
				})).max(10).describe('Array of record objects to create (max 10 per request)'),
				typecast: z.boolean().optional().describe('Automatically convert string values to appropriate field types'),
				returnFieldsByFieldId: z.boolean().optional().describe('Return field IDs instead of names as keys'),
			}),
		},

		{
			handle: 'updateRecord',
			description: 'Update fields of a single record using a PATCH request (only specified fields are updated).',
			scopes: ['write'],
			method: 'PATCH',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}/{{ input.recordId }}',
			body: {
				fields: '{{ input.fields }}',
				typecast: '{{ input.typecast }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				recordId: z.string().describe('The ID of the record to update'),
				fields: z.record(z.unknown()).describe('Field values to update'),
				typecast: z.boolean().optional().describe('Automatically convert string values to appropriate field types'),
			}),
		},

		{
			handle: 'updateRecords',
			description: 'Update multiple records in a single PATCH request. Supports upsert operations.',
			scopes: ['write'],
			method: 'PATCH',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}',
			body: {
				records: '{{ input.records }}',
				typecast: '{{ input.typecast }}',
				performUpsert: '{{ input.performUpsert }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				records: z.array(z.object({
					id: z.string().optional().describe('Record ID (required unless using upsert)'),
					fields: z.record(z.unknown()).describe('Field values to update'),
				})).max(10).describe('Array of records to update (max 10 per request)'),
				typecast: z.boolean().optional().describe('Automatically convert string values to appropriate field types'),
				performUpsert: z.object({
					fieldsToMergeOn: z.array(z.string()).describe('Field names to use as unique keys for upsert matching'),
				}).optional().describe('Upsert configuration — creates records if no match found'),
			}),
		},

		{
			handle: 'replaceRecord',
			description: 'Replace all fields of a record using a PUT request (unspecified fields are cleared).',
			scopes: ['write'],
			method: 'PUT',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}/{{ input.recordId }}',
			body: {
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				recordId: z.string().describe('The ID of the record to replace'),
				fields: z.record(z.unknown()).describe('Complete set of field values (unspecified fields will be cleared)'),
			}),
		},

		{
			handle: 'deleteRecord',
			description: 'Delete a single record from an Airtable table by its record ID.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}/{{ input.recordId }}',
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				recordId: z.string().describe('The ID of the record to delete'),
			}),
		},

		{
			handle: 'deleteRecords',
			description: 'Delete multiple records from an Airtable table in a single request (max 10).',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}',
			queryParams: {
				'records[]': '{{ input.records }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				records: z.array(z.string()).max(10).describe('Array of record IDs to delete (max 10)'),
			}),
		},

		{
			handle: 'listBases',
			description: 'List all Airtable bases accessible to the current API key.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/meta/bases',
			queryParams: {
				offset: '{{ input.offset }}',
			},
			inputSchema: z.object({
				offset: z.string().optional().describe('Pagination offset from a previous response'),
			}),
		},

		{
			handle: 'getBaseSchema',
			description: 'Retrieve the schema of all tables in an Airtable base.',
			scopes: ['schema'],
			method: 'GET',
			endpoint: '/meta/bases/{{ input.baseId }}/tables',
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID to get the schema for'),
			}),
		},

		{
			handle: 'createTable',
			description: 'Create a new table in an Airtable base with specified fields.',
			scopes: ['schema'],
			method: 'POST',
			endpoint: '/meta/bases/{{ input.baseId }}/tables',
			body: {
				name: '{{ input.name }}',
				description: '{{ input.description }}',
				fields: '{{ input.fields }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				name: z.string().describe('Name for the new table'),
				description: z.string().optional().describe('Optional description for the table'),
				fields: z.array(z.object({
					name: z.string().describe('Field name'),
					type: z.string().describe('Field type (e.g. singleLineText, number, checkbox, date)'),
					description: z.string().optional().describe('Optional field description'),
					options: z.record(z.unknown()).optional().describe('Field type-specific options'),
				})).describe('Array of field definitions for the new table'),
			}),
		},

		{
			handle: 'updateTable',
			description: 'Update the name or description of an existing Airtable table.',
			scopes: ['schema'],
			method: 'PATCH',
			endpoint: '/meta/bases/{{ input.baseId }}/tables/{{ input.tableId }}',
			body: {
				name: '{{ input.name }}',
				description: '{{ input.description }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableId: z.string().describe('The table ID to update'),
				name: z.string().optional().describe('New name for the table'),
				description: z.string().optional().describe('New description for the table'),
			}),
		},

		{
			handle: 'createField',
			description: 'Create a new field (column) in an existing Airtable table.',
			scopes: ['schema'],
			method: 'POST',
			endpoint: '/meta/bases/{{ input.baseId }}/tables/{{ input.tableId }}/fields',
			body: {
				name: '{{ input.name }}',
				type: '{{ input.type }}',
				description: '{{ input.description }}',
				options: '{{ input.options }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableId: z.string().describe('The table ID to add the field to'),
				name: z.string().describe('Name for the new field'),
				type: z.string().describe('Field type (e.g. singleLineText, number, checkbox, singleSelect, date)'),
				description: z.string().optional().describe('Optional description for the field'),
				options: z.record(z.unknown()).optional().describe('Field type-specific options'),
			}),
		},

		{
			handle: 'searchRecords',
			description: 'Search for records in a table using an Airtable formula.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/{{ input.baseId }}/{{ input.tableIdOrName }}',
			queryParams: {
				filterByFormula: '{{ input.formula }}',
				maxRecords: '{{ input.maxRecords }}',
				view: '{{ input.view }}',
				'fields[]': '{{ input.fields }}',
			},
			inputSchema: z.object({
				baseId: z.string().describe('The Airtable base ID'),
				tableIdOrName: z.string().describe('The table name or table ID'),
				formula: z.string().describe('Airtable formula to filter records'),
				maxRecords: z.number().int().min(1).optional().describe('Maximum number of records to return'),
				fields: z.array(z.string()).optional().describe('Array of field names to include in the response'),
				view: z.string().optional().describe('Name or ID of a view to restrict the search'),
			}),
		},
	],
};
