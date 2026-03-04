/**
 * @module Integration
 * The Integration class wraps an {@link IntegrationDefinition}, adding runtime
 * behaviour for HTTP tool execution, credential injection, and OAuth 2.0 token
 * refresh.
 */

import type {
	IntegrationDefinition,
	ToolDefinition,
	ToolContext,
	AgentCredential,
	OAuth2Credential,
	BearerCredential,
	BasicCredential,
	CustomCredential,
	CredentialSetup,
	OAuth2CredentialSetup,
} from './types/index.js';
import { renderWithConfig, renderWithInput, renderTemplate } from './utils/liquid.js';

// ─── Token refresh cache ──────────────────────────────────────────────────────

/** Tracks in-flight refresh promises to avoid race conditions. */
const refreshPromises = new WeakMap<OAuth2Credential, Promise<string>>();

// ─── Integration class ────────────────────────────────────────────────────────

/**
 * Runtime wrapper around an {@link IntegrationDefinition}.
 * Created automatically by {@link OpenMolt} when an integration is registered.
 */
export class Integration {
	/** The integration's unique handle within an OpenMolt instance. */
	readonly handle: string;

	/** The underlying integration definition supplied by the user or built-in config. */
	readonly definition: IntegrationDefinition;

	/**
	 * @param handle     - Unique identifier for this integration.
	 * @param definition - Full integration definition.
	 */
	constructor(handle: string, definition: IntegrationDefinition) {
		this.handle = handle;
		this.definition = definition;
	}

	/**
	 * Execute a tool for the given agent credential.
	 *
	 * The method:
	 * 1. Looks up the tool by handle.
	 * 2. Validates the tool exists.
	 * 3. Dispatches to either the custom `execute` function or the HTTP path.
	 *
	 * @param toolHandle - Handle of the tool to execute.
	 * @param input      - Tool input matching the tool's `inputSchema`.
	 * @param credential - Agent credential for authentication.
	 * @param context    - Execution context (agent name, etc.).
	 */
	async executeTool(
		toolHandle: string,
		input: Record<string, unknown>,
		credential: AgentCredential,
		context: ToolContext,
	): Promise<unknown> {
		const tool = this.definition.tools.find((t) => t.handle === toolHandle);
		if (!tool) {
			throw new Error(
				`Tool "${toolHandle}" not found in integration "${this.handle}". ` +
				`Available tools: ${this.definition.tools.map((t) => t.handle).join(', ')}`,
			);
		}

		if (tool.execute) {
			// Programmatic tool – delegate directly
			const config = this._extractConfig(credential);
			return tool.execute(input, { ...context, config });
		}

		// HTTP tool
		return this._executeHttpTool(tool, input, credential);
	}

	// ── Private: HTTP tool execution ─────────────────────────────────────────

	private async _executeHttpTool(
		tool: ToolDefinition,
		input: Record<string, unknown>,
		credential: AgentCredential,
	): Promise<unknown> {
		const apiSetup = this.definition.apiSetup;
		if (!apiSetup) {
			throw new Error(
				`Integration "${this.handle}" has no apiSetup but tool "${tool.handle}" is defined as an HTTP tool.`,
			);
		}

		const credConfig = this._extractConfig(credential);

		// 1. Resolve baseUrl (supports Liquid config templates for path-auth like Telegram)
		const baseUrl = await renderTemplate(apiSetup.baseUrl, {}, credConfig);

		// 2. Resolve endpoint
		const endpoint = tool.endpoint
			? await renderTemplate(tool.endpoint, input, credConfig)
			: '';

		// 3. Resolve auth headers from credential setup
		const authHeaders = await this._resolveAuthHeaders(credential, credConfig);
		const authQueryParams = await this._resolveAuthQueryParams(credential, credConfig);

		// 4. Resolve base headers from apiSetup
		const baseHeaders = apiSetup.headers
			? await renderWithConfig(apiSetup.headers as Record<string, unknown>, credConfig)
			: {};

		// 5. Resolve tool-specific headers
		const toolHeaders = tool.headers
			? await renderWithInput(tool.headers, input, credConfig)
			: {};

		// 6. Resolve query params
		const toolQueryParams = tool.queryParams
			? await renderWithInput(tool.queryParams, input, credConfig)
			: {};

		// 7. Resolve body
		const toolBody = tool.body
			? await renderWithInput(tool.body, input, credConfig)
			: undefined;

		// 8. Build URL
		const urlStr = baseUrl.replace(/\/$/, '') + endpoint;
		const url = new URL(urlStr);

		for (const [k, v] of Object.entries(authQueryParams)) {
			url.searchParams.set(k, String(v));
		}
		for (const [k, v] of Object.entries(toolQueryParams as Record<string, unknown>)) {
			if (v !== undefined && v !== null) {
				url.searchParams.set(k, String(v));
			}
		}

		// 9. Merge headers
		const headers: Record<string, string> = {
			...(baseHeaders as Record<string, string>),
			...(authHeaders as Record<string, string>),
			...(toolHeaders as Record<string, string>),
		};

		// 10. Build request init
		const method = (tool.method ?? 'GET').toUpperCase();
		const requestInit: RequestInit = { method, headers };

		if (toolBody !== undefined && method !== 'GET' && method !== 'HEAD') {
			const requestFormat = apiSetup.requestFormat ?? 'json';
			if (requestFormat === 'json') {
				requestInit.body = JSON.stringify(toolBody);
				headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
			} else if (requestFormat === 'form-data') {
				const form = new FormData();
				for (const [k, v] of Object.entries(toolBody as Record<string, unknown>)) {
					form.append(k, String(v));
				}
				requestInit.body = form;
			} else {
				requestInit.body = String(toolBody);
				headers['Content-Type'] = headers['Content-Type'] ?? 'text/plain';
			}
		}

		// 11. Execute request
		const response = await fetch(url.toString(), requestInit);

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(
				`HTTP ${response.status} from ${url.toString()}: ${errText.slice(0, 500)}`,
			);
		}

		// 12. Parse response
		const responseFormat = apiSetup.responseFormat ?? 'json';
		if (responseFormat === 'json') {
			const text = await response.text();
			if (!text) return {};
			try {
				return JSON.parse(text);
			} catch {
				return text;
			}
		}
		return response.text();
	}

	// ── Private: credential helpers ──────────────────────────────────────────

	/** Extract the raw config object from an agent credential. */
	private _extractConfig(credential: AgentCredential): Record<string, unknown> {
		return (credential.config ?? {}) as Record<string, unknown>;
	}

	/**
	 * Resolve the HTTP headers dictated by the credential.
	 * For OAuth2 credentials, automatically refreshes the access token if expired.
	 */
	private async _resolveAuthHeaders(
		credential: AgentCredential,
		config: Record<string, unknown>,
	): Promise<Record<string, string>> {
		// Find matching credential setup
		const setup = this._findCredentialSetup(credential.type);

		if (credential.type === 'oauth2') {
			const oauthSetup = setup as OAuth2CredentialSetup | undefined;
			const accessToken = await this._getOAuth2AccessToken(
				credential as OAuth2Credential,
				oauthSetup,
			);
			return { Authorization: `Bearer ${accessToken}` };
		}

		if (credential.type === 'basic') {
			const basic = credential as BasicCredential;
			const encoded = Buffer.from(`${basic.config.username}:${basic.config.password}`).toString('base64');
			return { Authorization: `Basic ${encoded}` };
		}

		// bearer / custom
		if (setup && 'headers' in setup && setup.headers) {
			return (await renderWithConfig(
				setup.headers as Record<string, unknown>,
				config,
			)) as Record<string, string>;
		}

		return {};
	}

	/** Resolve query parameters dictated by a `custom` credential setup. */
	private async _resolveAuthQueryParams(
		credential: AgentCredential,
		config: Record<string, unknown>,
	): Promise<Record<string, string>> {
		if (credential.type !== 'custom') return {};
		const setup = this._findCredentialSetup('custom');
		if (!setup || !('queryParams' in setup) || !setup.queryParams) return {};
		return (await renderWithConfig(
			setup.queryParams as Record<string, unknown>,
			config,
		)) as Record<string, string>;
	}

	/** Find the first credential setup entry that matches `type`. */
	private _findCredentialSetup(type: string): CredentialSetup | undefined {
		return this.definition.credentialSetup?.find((s) => s.type === type);
	}

	// ── Private: OAuth 2.0 token refresh ─────────────────────────────────────

	private async _getOAuth2AccessToken(
		credential: OAuth2Credential,
		setup: OAuth2CredentialSetup | undefined,
	): Promise<string> {
		// Check if existing token is still valid (>= 60 s buffer)
		if (credential.config.accessToken && credential.config.expiryDate) {
			const expiry = new Date(credential.config.expiryDate).getTime();
			if (expiry - Date.now() > 60_000) {
				return credential.config.accessToken;
			}
		}

		// Deduplicate concurrent refresh requests
		const existing = refreshPromises.get(credential);
		if (existing) return existing;

		const promise = this._doOAuth2Refresh(credential, setup);
		refreshPromises.set(credential, promise);
		try {
			return await promise;
		} finally {
			refreshPromises.delete(credential);
		}
	}

	private async _doOAuth2Refresh(
		credential: OAuth2Credential,
		setup: OAuth2CredentialSetup | undefined,
	): Promise<string> {
		const tokenUrl = setup?.tokenUrl ?? 'https://oauth2.googleapis.com/token';
		const config = credential.config;

		const params = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: config.refreshToken as string,
			client_id: config.clientId as string,
			client_secret: config.clientSecret as string,
		});

		const response = await fetch(tokenUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: params.toString(),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`OAuth2 token refresh failed (${response.status}): ${errText}`);
		}

		const data = (await response.json()) as {
			access_token: string;
			expires_in?: number;
			refresh_token?: string;
		};

		credential.config.accessToken = data.access_token;
		if (data.expires_in) {
			credential.config.expiryDate = new Date(Date.now() + data.expires_in * 1000).toISOString();
		}
		if (data.refresh_token) {
			credential.config.refreshToken = data.refresh_token;
		}

		if (credential.onTokenRefresh) {
			await credential.onTokenRefresh(credential.config);
		}

		return data.access_token;
	}
}
