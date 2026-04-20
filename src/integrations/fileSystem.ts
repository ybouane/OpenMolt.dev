/**
 * @module integrations/fileSystem
 * Local filesystem integration for reading, writing, and managing files.
 *
 * This integration is NOT registered by default. Use the factory function to
 * create an instance restricted to specific directories:
 *
 * ```typescript
 * om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('/data'));
 * ```
 */

import { z } from 'zod';
import {
	promises as fs,
	existsSync,
	statSync,
} from 'fs';
import path from 'path';
import type { IntegrationDefinition, ToolContext } from '../types/index.js';

// ─── Security helper ──────────────────────────────────────────────────────────

/**
 * Resolve and validate a user-supplied path against the list of allowed base
 * directories. Throws if the resolved path escapes all allowed roots.
 */
function resolveSafe(userPath: string, allowedDirs: string[]): string {
	const resolved = path.resolve(userPath);
	const allowed = allowedDirs.some((dir) => {
		const base = path.resolve(dir);
		return resolved === base || resolved.startsWith(base + path.sep);
	});
	if (!allowed) {
		throw new Error(
			`Access denied: path "${resolved}" is outside the allowed directories: ${allowedDirs.join(', ')}`,
		);
	}
	return resolved;
}

// ─── Recursive directory listing helper ──────────────────────────────────────

interface DirEntry {
	name: string;
	path: string;
	type: 'file' | 'directory';
	size?: number;
	modified?: string;
}

async function listDir(
	dirPath: string,
	recursive: boolean,
	includeHidden: boolean,
	allowedDirs: string[],
): Promise<DirEntry[]> {
	const entries = await fs.readdir(dirPath, { withFileTypes: true });
	const result: DirEntry[] = [];

	for (const entry of entries) {
		if (!includeHidden && entry.name.startsWith('.')) continue;

		const fullPath = path.join(dirPath, entry.name);
		resolveSafe(fullPath, allowedDirs); // security check on each entry

		const isDir = entry.isDirectory();
		const stat = await fs.stat(fullPath).catch(() => null);

		result.push({
			name: entry.name,
			path: fullPath,
			type: isDir ? 'directory' : 'file',
			size: stat && !isDir ? stat.size : undefined,
			modified: stat ? stat.mtime.toISOString() : undefined,
		});

		if (recursive && isDir) {
			const children = await listDir(fullPath, recursive, includeHidden, allowedDirs);
			result.push(...children);
		}
	}

	return result;
}

// ─── Pattern search helper ────────────────────────────────────────────────────

async function findFiles(
	dir: string,
	pattern: RegExp,
	recursive: boolean,
	allowedDirs: string[],
): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const matches: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		try {
			resolveSafe(fullPath, allowedDirs);
		} catch {
			continue;
		}

		if (entry.isDirectory() && recursive) {
			const sub = await findFiles(fullPath, pattern, recursive, allowedDirs);
			matches.push(...sub);
		} else if (entry.isFile() && pattern.test(entry.name)) {
			matches.push(fullPath);
		}
	}

	return matches;
}

// ─── Glob-to-regex converter ──────────────────────────────────────────────────

function globToRegex(glob: string): RegExp {
	const escaped = glob
		.replace(/[.+^${}()|[\]\\]/g, '\\$&')
		.replace(/\*/g, '.*')
		.replace(/\?/g, '.');
	return new RegExp(`^${escaped}$`, 'i');
}

// ─── Factory function ─────────────────────────────────────────────────────────

/**
 * Create a FileSystem integration restricted to the given directory or directories.
 *
 * @param directories - Allowed base directory (string) or list of directories.
 */
export function createFileSystemIntegration(
	directories: string | string[],
): IntegrationDefinition {
	const allowedDirs = (Array.isArray(directories) ? directories : [directories]).map((d) =>
		path.resolve(d),
	);

	return {
		name: 'FileSystem',
		instructions: `
### Scope
This integration only exposes paths under the configured allowed directories: **${allowedDirs.join(', ')}**. Any attempt to read/write outside these roots fails with an access-denied error. Do not try to traverse out with \`..\` — it will be rejected.

### Paths
Pass **absolute** paths when possible. Relative paths are resolved against the runtime's current working directory (see \`getWorkingDirectory\`), which is rarely what you want. If you only have a relative path from the user, call \`getWorkingDirectory\` first to confirm the anchor.

### Reading
\`readFile\` defaults to \`utf8\`. For binaries (images, PDFs, zip) pass \`encoding: "base64"\` — the result \`content\` will be base64-encoded and safe for piping into tools that accept base64 (e.g. vision APIs).

### Writing
\`writeFile\` requires **exactly one** of:
- \`content\`: inline string (text or already-encoded bytes, honours \`encoding\`).
- \`fromUrl\`: HTTP(S) URL whose response bytes are written verbatim (best for downloading a file to disk).

Providing both, or neither, is an error. Set \`createDirs: true\` if parent directories may not exist — otherwise writes into missing directories will fail.

### Directory ops
- \`listDirectory\` with \`recursive: true\` can be expensive on large trees. Prefer \`searchFiles\` when you know a name pattern.
- \`deleteDirectory\` requires \`recursive: true\` to remove non-empty directories.
- \`searchFiles\` uses a simple glob (\`*\`, \`?\`) over filenames only, case-insensitive — not a full regex and not content search.

### Safety
File operations are irreversible. Before \`deleteFile\`, \`deleteDirectory\`, or overwriting an existing file, consider confirming with the user (\`requestHumanInput\`) if the data appears non-trivial.
`,
		credentialSetup: [{ type: 'custom', headers: {} }],
		scopes: {
			read: 'Read files and list directories.',
			write: 'Write, create, move, copy, and delete files and directories.',
		},
		tools: [
			{
				handle: 'readFile',
				description: 'Read the contents of a file from the filesystem.',
				scopes: ['read'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					const encoding = (input.encoding as BufferEncoding) || 'utf8';
					if (encoding === 'base64') {
						const buf = await fs.readFile(safePath);
						return { content: buf.toString('base64'), encoding: 'base64', path: safePath };
					}
					const content = await fs.readFile(safePath, encoding);
					return { content, encoding, path: safePath };
				},
				inputSchema: z.object({
					path: z.string().describe('Path to the file to read'),
					encoding: z.enum(['utf8', 'binary', 'base64']).optional().describe('Encoding (default: utf8)'),
				}),
			},
			{
				handle: 'writeFile',
				description:
					'Write a file, creating it if it does not exist. Provide exactly one of `content` (inline string) or `fromUrl` (download the file from the given URL and write its bytes).',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					const hasContent = typeof input.content === 'string';
					const hasUrl = typeof input.fromUrl === 'string' && (input.fromUrl as string).length > 0;

					if (hasContent === hasUrl) {
						throw new Error('writeFile requires exactly one of "content" or "fromUrl".');
					}

					if (input.createDirs) {
						await fs.mkdir(path.dirname(safePath), { recursive: true });
					}

					if (hasUrl) {
						const url = input.fromUrl as string;
						const res = await fetch(url);
						if (!res.ok) {
							throw new Error(`Failed to fetch "${url}": ${res.status} ${res.statusText}`);
						}
						const buf = Buffer.from(await res.arrayBuffer());
						await fs.writeFile(safePath, buf);
						return { success: true, path: safePath, bytesWritten: buf.length, source: url };
					}

					await fs.writeFile(safePath, input.content as string, (input.encoding as BufferEncoding) || 'utf8');
					return { success: true, path: safePath };
				},
				inputSchema: z.object({
					path: z.string(),
					content: z.string().optional().describe('Inline content to write. Mutually exclusive with fromUrl.'),
					fromUrl: z.string().url().optional().describe('URL to download the file from. The response bytes are written verbatim. Mutually exclusive with content.'),
					encoding: z.string().optional().describe('Encoding for inline content (ignored when fromUrl is used). Default: utf8'),
					createDirs: z.boolean().optional().describe('Create parent directories if they do not exist'),
				}),
			},
			{
				handle: 'appendFile',
				description: 'Append content to an existing file (or create it if missing).',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					await fs.appendFile(safePath, input.content as string, 'utf8');
					return { success: true, path: safePath };
				},
				inputSchema: z.object({
					path: z.string(),
					content: z.string(),
				}),
			},
			{
				handle: 'deleteFile',
				description: 'Delete a file from the filesystem.',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					await fs.unlink(safePath);
					return { success: true, path: safePath };
				},
				inputSchema: z.object({
					path: z.string().describe('Path to the file to delete'),
				}),
			},
			{
				handle: 'moveFile',
				description: 'Move or rename a file or directory.',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const from = resolveSafe(input.from as string, allowedDirs);
					const to = resolveSafe(input.to as string, allowedDirs);
					await fs.rename(from, to);
					return { success: true, from, to };
				},
				inputSchema: z.object({
					from: z.string().describe('Source path'),
					to: z.string().describe('Destination path'),
				}),
			},
			{
				handle: 'copyFile',
				description: 'Copy a file to a new location.',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const from = resolveSafe(input.from as string, allowedDirs);
					const to = resolveSafe(input.to as string, allowedDirs);
					const flags = input.overwrite === false ? fs.constants?.COPYFILE_EXCL ?? 1 : 0;
					await fs.copyFile(from, to, flags);
					return { success: true, from, to };
				},
				inputSchema: z.object({
					from: z.string(),
					to: z.string(),
					overwrite: z.boolean().optional().describe('Allow overwriting existing files (default: true)'),
				}),
			},
			{
				handle: 'listDirectory',
				description: 'List the contents of a directory.',
				scopes: ['read'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					const entries = await listDir(
						safePath,
						input.recursive === true,
						input.includeHidden === true,
						allowedDirs,
					);
					return { path: safePath, entries };
				},
				inputSchema: z.object({
					path: z.string().describe('Directory path to list'),
					recursive: z.boolean().optional().describe('List subdirectories recursively'),
					includeHidden: z.boolean().optional().describe('Include hidden files (starting with .)'),
				}),
			},
			{
				handle: 'createDirectory',
				description: 'Create a directory (and any necessary parent directories).',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					await fs.mkdir(safePath, { recursive: input.recursive !== false });
					return { success: true, path: safePath };
				},
				inputSchema: z.object({
					path: z.string(),
					recursive: z.boolean().optional().describe('Create parent directories (default: true)'),
				}),
			},
			{
				handle: 'deleteDirectory',
				description: 'Delete a directory.',
				scopes: ['write'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					await fs.rm(safePath, { recursive: input.recursive === true, force: true });
					return { success: true, path: safePath };
				},
				inputSchema: z.object({
					path: z.string(),
					recursive: z.boolean().optional().describe('Delete subdirectories and files recursively'),
				}),
			},
			{
				handle: 'fileExists',
				description: 'Check whether a file or directory exists at the given path.',
				scopes: ['read'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					const exists = existsSync(safePath);
					if (!exists) return { exists: false };
					const stat = statSync(safePath);
					return { exists: true, type: stat.isDirectory() ? 'directory' : 'file' };
				},
				inputSchema: z.object({
					path: z.string(),
				}),
				outputSchema: z.object({
					exists: z.boolean(),
					type: z.enum(['file', 'directory']).optional(),
				}),
			},
			{
				handle: 'getFileInfo',
				description: 'Get metadata for a file or directory.',
				scopes: ['read'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.path as string, allowedDirs);
					const stat = await fs.stat(safePath);
					return {
						name: path.basename(safePath),
						path: safePath,
						size: stat.size,
						created: stat.birthtime.toISOString(),
						modified: stat.mtime.toISOString(),
						isFile: stat.isFile(),
						isDirectory: stat.isDirectory(),
					};
				},
				inputSchema: z.object({
					path: z.string(),
				}),
			},
			{
				handle: 'searchFiles',
				description: 'Search for files matching a glob pattern within a directory.',
				scopes: ['read'],
				execute: async (input: Record<string, unknown>, _ctx: ToolContext) => {
					const safePath = resolveSafe(input.directory as string, allowedDirs);
					const pattern = globToRegex(input.pattern as string);
					const files = await findFiles(safePath, pattern, input.recursive !== false, allowedDirs);
					return { matches: files, count: files.length };
				},
				inputSchema: z.object({
					directory: z.string().describe('Directory to search in'),
					pattern: z.string().describe('Glob pattern to match filenames (e.g. *.ts, report-*.csv)'),
					recursive: z.boolean().optional().describe('Search subdirectories (default: true)'),
				}),
			},
			{
				handle: 'getWorkingDirectory',
				description: 'Get the current working directory of the process.',
				scopes: ['read'],
				execute: async (_input: Record<string, unknown>, _ctx: ToolContext) => {
					return { cwd: process.cwd(), allowedDirectories: allowedDirs };
				},
				inputSchema: z.object({}),
			},
		],
	};
}

/**
 * Default FileSystem integration (unrestricted root access).
 * Prefer {@link createFileSystemIntegration} with explicit directories in production.
 */
export const fileSystemDefinition: IntegrationDefinition = createFileSystemIntegration('/');
