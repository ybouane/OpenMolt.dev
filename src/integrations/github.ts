/**
 * @module integrations/github
 * GitHub REST API v3 integration definition.
 */

import { z } from 'zod';
import type { IntegrationDefinition } from '../types/index.js';

export const githubDefinition: IntegrationDefinition = {
	name: 'GitHub',
	apiSetup: {
		baseUrl: 'https://api.github.com',
		headers: {
			Authorization: 'Bearer {{ config.apiKey }}',
			Accept: 'application/vnd.github+json',
			'X-GitHub-Api-Version': '2022-11-28',
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
		read: 'Read user, repository, and metadata information',
		write: 'Create and update repositories and files',
		issues: 'Read and write issues and comments',
		pull_requests: 'Read and write pull requests',
		contents: 'Read and write repository file contents',
		actions: 'Read and trigger GitHub Actions workflow runs',
	},
	tools: [
		// ── User ─────────────────────────────────────────────────────────────────

		{
			handle: 'getAuthenticatedUser',
			description: 'Get the authenticated GitHub user profile.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/user',
			inputSchema: z.object({}),
		},

		// ── Repositories ─────────────────────────────────────────────────────────

		{
			handle: 'listRepos',
			description: 'List repositories for the authenticated user.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/user/repos',
			queryParams: {
				type: '{{ input.type }}',
				sort: '{{ input.sort }}',
				direction: '{{ input.direction }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				type: z.string().optional().describe('Filter by type: all, owner, public, private, member'),
				sort: z.string().optional().describe('Sort by: created, updated, pushed, full_name'),
				direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page (max 100)'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'getRepo',
			description: 'Get a GitHub repository by owner and name.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}',
			inputSchema: z.object({
				owner: z.string().describe('Repository owner (username or org)'),
				repo: z.string().describe('Repository name'),
			}),
		},

		{
			handle: 'createRepo',
			description: 'Create a new GitHub repository for the authenticated user.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/user/repos',
			body: {
				name: '{{ input.name }}',
				description: '{{ input.description }}',
				private: '{{ input.private }}',
				auto_init: '{{ input.auto_init }}',
				gitignore_template: '{{ input.gitignore_template }}',
				license_template: '{{ input.license_template }}',
			},
			inputSchema: z.object({
				name: z.string().describe('Repository name'),
				description: z.string().optional().describe('Short description of the repository'),
				private: z.boolean().optional().describe('Whether the repository should be private'),
				auto_init: z.boolean().optional().describe('Initialize the repository with a README'),
				gitignore_template: z.string().optional().describe('.gitignore template name (e.g. "Node")'),
				license_template: z.string().optional().describe('Open source license template (e.g. "mit")'),
			}),
		},

		{
			handle: 'deleteRepo',
			description: 'Delete a GitHub repository. This action cannot be undone.',
			scopes: ['write'],
			method: 'DELETE',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}',
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
			}),
		},

		// ── Issues ───────────────────────────────────────────────────────────────

		{
			handle: 'listIssues',
			description: 'List issues in a repository with optional filters.',
			scopes: ['issues'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues',
			queryParams: {
				state: '{{ input.state }}',
				labels: '{{ input.labels }}',
				milestone: '{{ input.milestone }}',
				assignee: '{{ input.assignee }}',
				creator: '{{ input.creator }}',
				mentioned: '{{ input.mentioned }}',
				sort: '{{ input.sort }}',
				direction: '{{ input.direction }}',
				since: '{{ input.since }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				state: z.enum(['open', 'closed', 'all']).optional().describe('Issue state filter'),
				labels: z.string().optional().describe('Comma-separated list of label names to filter by'),
				milestone: z.string().optional().describe('Milestone number or "*" for any, "none" for none'),
				assignee: z.string().optional().describe('Assignee username, "*" for any, "none" for unassigned'),
				creator: z.string().optional().describe('Filter by issue creator username'),
				mentioned: z.string().optional().describe('Filter by mentioned username'),
				sort: z.string().optional().describe('Sort by: created, updated, comments'),
				direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
				since: z.string().optional().describe('ISO 8601 date — only return issues updated after this time'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'getIssue',
			description: 'Get a single issue by repository and issue number.',
			scopes: ['issues'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues/{{ input.issue_number }}',
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				issue_number: z.number().int().describe('The issue number'),
			}),
		},

		{
			handle: 'createIssue',
			description: 'Create a new issue in a repository.',
			scopes: ['issues'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues',
			body: {
				title: '{{ input.title }}',
				body: '{{ input.body }}',
				assignees: '{{ input.assignees }}',
				labels: '{{ input.labels }}',
				milestone: '{{ input.milestone }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				title: z.string().describe('Issue title'),
				body: z.string().optional().describe('Issue body / description (Markdown)'),
				assignees: z.array(z.string()).optional().describe('Array of usernames to assign'),
				labels: z.array(z.string()).optional().describe('Array of label names to apply'),
				milestone: z.number().int().optional().describe('Milestone number to associate with'),
			}),
		},

		{
			handle: 'updateIssue',
			description: 'Update an existing issue (title, body, state, labels, assignees, milestone).',
			scopes: ['issues'],
			method: 'PATCH',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues/{{ input.issue_number }}',
			body: {
				title: '{{ input.title }}',
				body: '{{ input.body }}',
				state: '{{ input.state }}',
				labels: '{{ input.labels }}',
				assignees: '{{ input.assignees }}',
				milestone: '{{ input.milestone }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				issue_number: z.number().int().describe('The issue number to update'),
				title: z.string().optional().describe('New title'),
				body: z.string().optional().describe('New body'),
				state: z.enum(['open', 'closed']).optional().describe('New state'),
				labels: z.array(z.string()).optional().describe('New set of labels'),
				assignees: z.array(z.string()).optional().describe('New set of assignees'),
				milestone: z.number().int().nullable().optional().describe('Milestone number, or null to clear'),
			}),
		},

		{
			handle: 'createIssueComment',
			description: 'Create a comment on an issue.',
			scopes: ['issues'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues/{{ input.issue_number }}/comments',
			body: {
				body: '{{ input.body }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				issue_number: z.number().int().describe('The issue number to comment on'),
				body: z.string().describe('Comment body text (Markdown)'),
			}),
		},

		// ── Pull Requests ─────────────────────────────────────────────────────────

		{
			handle: 'listPullRequests',
			description: 'List pull requests in a repository.',
			scopes: ['pull_requests'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/pulls',
			queryParams: {
				state: '{{ input.state }}',
				head: '{{ input.head }}',
				base: '{{ input.base }}',
				sort: '{{ input.sort }}',
				direction: '{{ input.direction }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				state: z.enum(['open', 'closed', 'all']).optional().describe('PR state filter'),
				head: z.string().optional().describe('Filter by head branch (format: user:ref-name)'),
				base: z.string().optional().describe('Filter by base branch name'),
				sort: z.string().optional().describe('Sort by: created, updated, popularity, long-running'),
				direction: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'createPullRequest',
			description: 'Create a new pull request.',
			scopes: ['pull_requests'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/pulls',
			body: {
				title: '{{ input.title }}',
				body: '{{ input.body }}',
				head: '{{ input.head }}',
				base: '{{ input.base }}',
				draft: '{{ input.draft }}',
				maintainer_can_modify: '{{ input.maintainer_can_modify }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				title: z.string().describe('PR title'),
				body: z.string().optional().describe('PR description (Markdown)'),
				head: z.string().describe('The head branch name (the branch with changes)'),
				base: z.string().describe('The base branch name (the branch to merge into)'),
				draft: z.boolean().optional().describe('Whether to create as a draft PR'),
				maintainer_can_modify: z.boolean().optional().describe('Whether maintainers can push to the head branch'),
			}),
		},

		{
			handle: 'mergePullRequest',
			description: 'Merge a pull request.',
			scopes: ['pull_requests'],
			method: 'PUT',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/pulls/{{ input.pull_number }}/merge',
			body: {
				commit_title: '{{ input.commit_title }}',
				commit_message: '{{ input.commit_message }}',
				merge_method: '{{ input.merge_method }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				pull_number: z.number().int().describe('The pull request number'),
				commit_title: z.string().optional().describe('Title for the automatic merge commit'),
				commit_message: z.string().optional().describe('Extra detail to append to merge commit message'),
				merge_method: z.enum(['merge', 'squash', 'rebase']).optional().describe('Merge strategy'),
			}),
		},

		// ── File Contents ─────────────────────────────────────────────────────────

		{
			handle: 'getFileContents',
			description: 'Get the contents of a file in a repository. The content field in the response is base64-encoded.',
			scopes: ['contents'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/contents/{{ input.path }}',
			queryParams: {
				ref: '{{ input.ref }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				path: z.string().describe('Path to the file within the repository'),
				ref: z.string().optional().describe('Branch, tag, or commit SHA to get file from'),
			}),
		},

		{
			handle: 'createOrUpdateFile',
			description: 'Create or update a file in a repository. Content must be base64-encoded.',
			scopes: ['contents'],
			method: 'PUT',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/contents/{{ input.path }}',
			body: {
				message: '{{ input.message }}',
				content: '{{ input.content }}',
				sha: '{{ input.sha }}',
				branch: '{{ input.branch }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				path: z.string().describe('Path for the file in the repository'),
				message: z.string().describe('Commit message'),
				content: z.string().describe('Base64-encoded file content'),
				sha: z.string().optional().describe('Blob SHA of the existing file (required when updating)'),
				branch: z.string().optional().describe('Branch to commit to (defaults to default branch)'),
			}),
		},

		{
			handle: 'deleteFile',
			description: 'Delete a file from a repository.',
			scopes: ['contents'],
			method: 'DELETE',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/contents/{{ input.path }}',
			body: {
				message: '{{ input.message }}',
				sha: '{{ input.sha }}',
				branch: '{{ input.branch }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				path: z.string().describe('Path to the file to delete'),
				message: z.string().describe('Commit message'),
				sha: z.string().describe('Blob SHA of the file being deleted'),
				branch: z.string().optional().describe('Branch to delete from'),
			}),
		},

		// ── Branches ─────────────────────────────────────────────────────────────

		{
			handle: 'listBranches',
			description: 'List branches in a repository.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/branches',
			queryParams: {
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'createBranch',
			description: 'Create a new branch by creating a git ref pointing to a specific commit SHA.',
			scopes: ['write'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/git/refs',
			body: {
				ref: '{{ input.ref }}',
				sha: '{{ input.sha }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				ref: z.string().describe('Full ref name (e.g. "refs/heads/my-branch")'),
				sha: z.string().describe('SHA to branch from'),
			}),
		},

		// ── Commits ──────────────────────────────────────────────────────────────

		{
			handle: 'listCommits',
			description: 'List commits in a repository with optional filters.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/commits',
			queryParams: {
				sha: '{{ input.sha }}',
				path: '{{ input.path }}',
				author: '{{ input.author }}',
				since: '{{ input.since }}',
				until: '{{ input.until }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				sha: z.string().optional().describe('SHA or branch name to start listing commits from'),
				path: z.string().optional().describe('Only include commits touching this path'),
				author: z.string().optional().describe('Filter by author username or email'),
				since: z.string().optional().describe('ISO 8601 date — only commits after this time'),
				until: z.string().optional().describe('ISO 8601 date — only commits before this time'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		// ── Search ───────────────────────────────────────────────────────────────

		{
			handle: 'searchCode',
			description: 'Search for code across GitHub repositories using the code search API.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/search/code',
			queryParams: {
				q: '{{ input.q }}',
				sort: '{{ input.sort }}',
				order: '{{ input.order }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				q: z.string().describe('Search query (supports qualifiers like repo:, language:, path:)'),
				sort: z.string().optional().describe('Sort field (only "indexed" is supported)'),
				order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'searchRepos',
			description: 'Search GitHub repositories by query string.',
			scopes: ['read'],
			method: 'GET',
			endpoint: '/search/repositories',
			queryParams: {
				q: '{{ input.q }}',
				sort: '{{ input.sort }}',
				order: '{{ input.order }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				q: z.string().describe('Search query (supports qualifiers like language:, stars:, etc.)'),
				sort: z.string().optional().describe('Sort by: stars, forks, help-wanted-issues, updated'),
				order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		{
			handle: 'searchIssues',
			description: 'Search issues and pull requests across GitHub.',
			scopes: ['issues'],
			method: 'GET',
			endpoint: '/search/issues',
			queryParams: {
				q: '{{ input.q }}',
				sort: '{{ input.sort }}',
				order: '{{ input.order }}',
				per_page: '{{ input.per_page }}',
				page: '{{ input.page }}',
			},
			inputSchema: z.object({
				q: z.string().describe('Search query (supports qualifiers like is:issue, is:pr, repo:, label:)'),
				sort: z.string().optional().describe('Sort by: comments, reactions, created, updated, etc.'),
				order: z.enum(['asc', 'desc']).optional().describe('Sort order'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
				page: z.number().int().optional().describe('Page number'),
			}),
		},

		// ── Actions ──────────────────────────────────────────────────────────────

		{
			handle: 'getWorkflowRuns',
			description: 'List workflow runs for a repository, optionally filtered by workflow, branch, or status.',
			scopes: ['actions'],
			method: 'GET',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/actions/runs',
			queryParams: {
				workflow_id: '{{ input.workflow_id }}',
				branch: '{{ input.branch }}',
				status: '{{ input.status }}',
				per_page: '{{ input.per_page }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				workflow_id: z.string().optional().describe('Workflow file name or ID to filter by'),
				branch: z.string().optional().describe('Branch name to filter by'),
				status: z.string().optional().describe('Status filter: completed, action_required, cancelled, failure, neutral, skipped, stale, success, timed_out, in_progress, queued, requested, waiting'),
				per_page: z.number().int().min(1).max(100).optional().describe('Results per page'),
			}),
		},

		{
			handle: 'triggerWorkflow',
			description: 'Trigger a workflow dispatch event to run a workflow on a specific branch.',
			scopes: ['actions'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/actions/workflows/{{ input.workflow_id }}/dispatches',
			body: {
				ref: '{{ input.ref }}',
				inputs: '{{ input.inputs }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				workflow_id: z.string().describe('Workflow file name (e.g. "ci.yml") or workflow ID'),
				ref: z.string().describe('Branch or tag to trigger the workflow on'),
				inputs: z.record(z.string()).optional().describe('Input key-value pairs defined in the workflow'),
			}),
		},

		// ── Reactions ────────────────────────────────────────────────────────────

		{
			handle: 'addReactionToIssue',
			description: 'Add a reaction emoji to an issue.',
			scopes: ['issues'],
			method: 'POST',
			endpoint: '/repos/{{ input.owner }}/{{ input.repo }}/issues/{{ input.issue_number }}/reactions',
			body: {
				content: '{{ input.content }}',
			},
			inputSchema: z.object({
				owner: z.string().describe('Repository owner'),
				repo: z.string().describe('Repository name'),
				issue_number: z.number().int().describe('The issue number'),
				content: z.enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes']).describe('The reaction type'),
			}),
		},
	],
};
