import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const googleSheetsDefinition: IntegrationDefinition = {
	name: 'Google Sheets',
	instructions: `
### Spreadsheet ID
\`spreadsheetId\` is the long string from the URL (\`/spreadsheets/d/<ID>/edit\`), not the file's display name. Use Drive's \`searchFiles\` if you only know the title.

### A1 notation for ranges
Every \`range\` argument uses A1 notation:
- \`"Sheet1!A1:C10"\` — 3×10 block on tab "Sheet1".
- \`"Sheet1!A:A"\` — whole column A.
- \`"Sheet1!2:2"\` — whole row 2.
- \`"'My Sheet'!A1"\` — quote the sheet name when it has spaces or special chars.
- \`"A1:C10"\` without a sheet name defaults to the first visible sheet.

Get the list of tab names via \`getSpreadsheet\` (inspect \`sheets[].properties.title\`).

### Values are always 2D arrays
Every read/write of cells uses \`values: [[...], [...], ...]\` — rows of cells. A single cell is \`[["hi"]]\`, not \`"hi"\`. Empty cells come back as empty strings, and trailing empty cells are often omitted — never rely on row length being equal.

### valueInputOption
Writes (\`updateValues\`, \`appendValues\`, \`batchUpdateValues\`) accept \`valueInputOption\`:
- \`"USER_ENTERED"\` — strings are parsed like typing in the UI (formulas, dates, numbers). Use this when you want \`=SUM(A:A)\` to work or \`"2026-01-15"\` to become a date.
- \`"RAW"\` — store exactly as provided, no parsing.

### Append vs update
- \`updateValues\` overwrites the exact range you specify.
- \`appendValues\` finds the **first empty row at/after** the given range and writes there. Ideal for log-style append-only sheets. Pass the top-left of the table (e.g. \`"Sheet1!A1"\`) and Sheets will figure out where to land.

### Batch vs single calls
Google Sheets enforces tight per-minute rate limits. If you need to write ~N cells, prefer:
- \`batchUpdateValues\` when updating **several disjoint ranges** with values.
- \`batchUpdate\` (note: different endpoint) for **structural changes** — adding sheets, formatting, merging, inserting rows, freezing panes. Takes a \`requests\` array of typed command objects (e.g. \`{ "addSheet": {...} }\`, \`{ "updateCells": {...} }\`).

### Creating a new sheet
- \`createSpreadsheet\` — new spreadsheet file (also creates a Drive file). Give it a \`properties.title\` and an initial \`sheets\` array.
- \`addSheet\` — new tab within an existing spreadsheet.

### Clearing data
\`clearValues\` removes cell values but preserves formatting. To also delete formatting, use a \`batchUpdate\` with \`{ "updateCells": { range, fields: "*" } }\`.

### sheetId vs title
- \`title\` is user-facing (\`"Sheet1"\`).
- \`sheetId\` is the stable numeric ID used by structural ops (\`batchUpdate\`, \`deleteSheet\`). Don't confuse the two.
`,
	apiSetup: {
		baseUrl: 'https://sheets.googleapis.com/v4',
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
				'https://www.googleapis.com/auth/spreadsheets',
				'https://www.googleapis.com/auth/spreadsheets.readonly',
			],
		},
	],
	scopes: {
		read: 'Read spreadsheet data and metadata',
		write: 'Create and modify spreadsheets and their data',
	},
	tools: [
		{
			handle: 'getSpreadsheet',
			description: 'Get spreadsheet metadata including sheet properties and named ranges',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}',
			queryParams: {
				ranges: '{{ input.ranges }}',
				includeGridData: '{{ input.includeGridData }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet to retrieve'),
				ranges: z.array(z.string()).optional().describe('Ranges to retrieve from the spreadsheet'),
				includeGridData: z.boolean().optional().describe('Whether to include grid data in the response'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				properties: z.object({
					title: z.string(),
					locale: z.string().optional(),
					timeZone: z.string().optional(),
				}).optional(),
				sheets: z.array(z.object({
					properties: z.object({
						sheetId: z.number(),
						title: z.string(),
						index: z.number(),
						sheetType: z.string(),
					}),
				})).optional(),
				spreadsheetUrl: z.string().optional(),
			}),
		},
		{
			handle: 'createSpreadsheet',
			description: 'Create a new Google Sheets spreadsheet',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets',
			body: {
				properties: {
					title: '{{ input.title }}',
				},
				sheets: '{{ input.sheets }}',
			},
			inputSchema: z.object({
				title: z.string().describe('Title of the new spreadsheet'),
				sheets: z.array(z.object({
					properties: z.object({
						title: z.string().optional(),
						gridProperties: z.object({
							rowCount: z.number().optional(),
							columnCount: z.number().optional(),
						}).optional(),
					}).optional(),
				})).optional().describe('Initial sheet configurations'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				spreadsheetUrl: z.string(),
				properties: z.object({
					title: z.string(),
				}).optional(),
				sheets: z.array(z.object({
					properties: z.object({
						sheetId: z.number(),
						title: z.string(),
					}),
				})).optional(),
			}),
		},
		{
			handle: 'getValues',
			description: 'Get values from a specific range in a spreadsheet',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values/{{ input.range }}',
			queryParams: {
				majorDimension: '{{ input.majorDimension }}',
				valueRenderOption: '{{ input.valueRenderOption }}',
				dateTimeRenderOption: '{{ input.dateTimeRenderOption }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				range: z.string().describe('The A1 notation of the range to retrieve (e.g. Sheet1!A1:D10)'),
				majorDimension: z.enum(['ROWS', 'COLUMNS']).optional().describe('The major dimension of the values'),
				valueRenderOption: z.string().optional().describe('How values should be represented (FORMATTED_VALUE, UNFORMATTED_VALUE, FORMULA)'),
				dateTimeRenderOption: z.string().optional().describe('How dates, times, and durations should be represented'),
			}),
			outputSchema: z.object({
				range: z.string(),
				majorDimension: z.string(),
				values: z.array(z.array(z.unknown())).optional(),
			}),
		},
		{
			handle: 'batchGetValues',
			description: 'Get values from multiple ranges in a spreadsheet in a single request',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values:batchGet',
			queryParams: {
				ranges: '{{ input.ranges }}',
				majorDimension: '{{ input.majorDimension }}',
				valueRenderOption: '{{ input.valueRenderOption }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				ranges: z.array(z.string()).describe('The A1 notation ranges to retrieve'),
				majorDimension: z.string().optional().describe('The major dimension of the values'),
				valueRenderOption: z.string().optional().describe('How values should be represented'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				valueRanges: z.array(z.object({
					range: z.string(),
					majorDimension: z.string(),
					values: z.array(z.array(z.unknown())).optional(),
				})),
			}),
		},
		{
			handle: 'updateValues',
			description: 'Update values in a specific range of a spreadsheet',
			scopes: ['write'],
			method: 'PUT',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values/{{ input.range }}',
			queryParams: {
				valueInputOption: '{{ input.valueInputOption }}',
			},
			body: {
				range: '{{ input.range }}',
				majorDimension: '{{ input.majorDimension }}',
				values: '{{ input.values }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				range: z.string().describe('The A1 notation of the range to update'),
				values: z.array(z.array(z.unknown())).describe('The data to write'),
				majorDimension: z.string().optional().describe('The major dimension of the values'),
				valueInputOption: z.enum(['RAW', 'USER_ENTERED']).optional().default('USER_ENTERED').describe('How input data should be interpreted'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				updatedRange: z.string(),
				updatedRows: z.number(),
				updatedColumns: z.number(),
				updatedCells: z.number(),
			}),
		},
		{
			handle: 'batchUpdateValues',
			description: 'Update values in multiple ranges of a spreadsheet in a single request',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values:batchUpdate',
			body: {
				valueInputOption: '{{ input.valueInputOption }}',
				data: '{{ input.data }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				data: z.array(z.object({
					range: z.string().describe('The A1 notation range'),
					values: z.array(z.array(z.unknown())).describe('The data to write'),
					majorDimension: z.string().optional(),
				})).describe('Array of range/value pairs to update'),
				valueInputOption: z.string().optional().default('USER_ENTERED').describe('How input data should be interpreted'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				totalUpdatedRows: z.number(),
				totalUpdatedColumns: z.number(),
				totalUpdatedCells: z.number(),
				responses: z.array(z.object({
					updatedRange: z.string(),
					updatedRows: z.number(),
					updatedColumns: z.number(),
					updatedCells: z.number(),
				})),
			}),
		},
		{
			handle: 'appendValues',
			description: 'Append values to a spreadsheet after the last row of data in a range',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values/{{ input.range }}:append',
			queryParams: {
				valueInputOption: '{{ input.valueInputOption }}',
				insertDataOption: '{{ input.insertDataOption }}',
			},
			body: {
				range: '{{ input.range }}',
				values: '{{ input.values }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				range: z.string().describe('The A1 notation of the range to append to'),
				values: z.array(z.array(z.unknown())).describe('The data to append'),
				valueInputOption: z.string().optional().default('USER_ENTERED').describe('How input data should be interpreted'),
				insertDataOption: z.string().optional().describe('How input data should be inserted (OVERWRITE or INSERT_ROWS)'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				tableRange: z.string().optional(),
				updates: z.object({
					updatedRange: z.string(),
					updatedRows: z.number(),
					updatedColumns: z.number(),
					updatedCells: z.number(),
				}),
			}),
		},
		{
			handle: 'clearValues',
			description: 'Clear values from a specific range in a spreadsheet',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values/{{ input.range }}:clear',
			body: {},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				range: z.string().describe('The A1 notation of the range to clear'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				clearedRange: z.string(),
			}),
		},
		{
			handle: 'batchClearValues',
			description: 'Clear values from multiple ranges in a spreadsheet in a single request',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values:batchClear',
			body: {
				ranges: '{{ input.ranges }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				ranges: z.array(z.string()).describe('The A1 notation ranges to clear'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				clearedRanges: z.array(z.string()),
			}),
		},
		{
			handle: 'batchUpdate',
			description: 'Execute one or more batch update requests to modify spreadsheet structure or formatting',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}:batchUpdate',
			body: {
				requests: '{{ input.requests }}',
				includeSpreadsheetInResponse: false,
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				requests: z.array(z.record(z.unknown())).describe('List of update requests (addSheet, deleteSheet, updateSheetProperties, addConditionalFormatRule, etc.)'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				replies: z.array(z.record(z.unknown())),
			}),
		},
		{
			handle: 'addSheet',
			description: 'Add a new sheet (tab) to an existing spreadsheet',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}:batchUpdate',
			body: {
				requests: [
					{
						addSheet: {
							properties: {
								title: '{{ input.title }}',
								gridProperties: {
									rowCount: '{{ input.rowCount }}',
									columnCount: '{{ input.columnCount }}',
								},
							},
						},
					},
				],
				includeSpreadsheetInResponse: false,
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				title: z.string().describe('Title for the new sheet'),
				rowCount: z.number().int().optional().describe('Number of rows in the new sheet'),
				columnCount: z.number().int().optional().describe('Number of columns in the new sheet'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				replies: z.array(z.record(z.unknown())).optional(),
			}),
		},
		{
			handle: 'deleteSheet',
			description: 'Delete a sheet (tab) from a spreadsheet by its sheet ID',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}:batchUpdate',
			body: {
				requests: [
					{
						deleteSheet: {
							sheetId: '{{ input.sheetId }}',
						},
					},
				],
				includeSpreadsheetInResponse: false,
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				sheetId: z.number().int().describe('The numeric ID of the sheet to delete'),
			}),
			outputSchema: z.object({
				spreadsheetId: z.string(),
				replies: z.array(z.record(z.unknown())).optional(),
			}),
		},
		{
			handle: 'getSheetData',
			description: 'Get all data from a named sheet in a spreadsheet',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/spreadsheets/{{ input.spreadsheetId }}/values/{{ input.sheetName }}',
			queryParams: {
				valueRenderOption: '{{ input.valueRenderOption }}',
			},
			inputSchema: z.object({
				spreadsheetId: z.string().describe('The ID of the spreadsheet'),
				sheetName: z.string().describe('The name of the sheet to retrieve data from'),
				valueRenderOption: z.string().optional().describe('How values should be represented (FORMATTED_VALUE, UNFORMATTED_VALUE, FORMULA)'),
			}),
			outputSchema: z.object({
				range: z.string(),
				majorDimension: z.string(),
				values: z.array(z.array(z.unknown())).optional(),
			}),
		},
	],
};
