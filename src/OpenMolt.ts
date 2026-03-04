/**
 * @module OpenMolt
 * The main entry-point class for the OpenMolt agent framework.
 *
 * Create an instance, optionally register additional integrations, then call
 * {@link OpenMolt.createAgent} to obtain a runnable {@link Agent}.
 *
 * @example
 * ```typescript
 * import OpenMolt from 'openmolt';
 *
 * const om = new OpenMolt({ llmProviders: { openai: { apiKey: 'sk-...' } } });
 * const agent = om.createAgent({ name: 'Bot', model: 'openai:gpt-4o', instructions: '...' });
 * const result = await agent.run('Hello!');
 * ```
 */

import type { OpenMoltConfig, AgentConfig, IntegrationDefinition } from './types/index.js';
import { Integration } from './Integration.js';
import { Agent } from './Agent.js';
import { createFileSystemIntegration } from './integrations/fileSystem.js';

// Built-in integration definitions (tree-shakeable)
import { notionDefinition } from './integrations/notion.js';
import { falDefinition } from './integrations/fal.js';
import { googleCalendarDefinition } from './integrations/googleCalendar.js';
import { gmailDefinition } from './integrations/gmail.js';
import { googleDriveDefinition } from './integrations/googleDrive.js';
import { googleSheetsDefinition } from './integrations/googleSheets.js';
import { microsoftOutlookDefinition } from './integrations/microsoftOutlook.js';
import { geminiMediaDefinition } from './integrations/geminiMedia.js';
import { openaiImagesDefinition } from './integrations/openaiImages.js';
import { discordDefinition } from './integrations/discord.js';
import { slackDefinition } from './integrations/slack.js';
import { telegramDefinition } from './integrations/telegram.js';
import { whatsappDefinition } from './integrations/whatsapp.js';
import { twitterDefinition } from './integrations/twitter.js';
import { instagramDefinition } from './integrations/instagram.js';
import { twilioDefinition } from './integrations/twilio.js';
import { airtableDefinition } from './integrations/airtable.js';
import { tiktokDefinition } from './integrations/tiktok.js';
import { youtubeDefinition } from './integrations/youtube.js';
import { s3Definition } from './integrations/s3.js';
import { shopifyDefinition } from './integrations/shopify.js';
import { stripeDefinition } from './integrations/stripe.js';
import { etsyDefinition } from './integrations/etsy.js';
import { githubDefinition } from './integrations/github.js';
import { dropboxDefinition } from './integrations/dropbox.js';
import { googleAdsDefinition } from './integrations/googleAds.js';
import { metaAdsDefinition } from './integrations/metaAds.js';
import { browserUseDefinition } from './integrations/browserUse.js';
import { httpRequestDefinition } from './integrations/httpRequest.js';

/** Map of all built-in integration handles to their definitions. */
const BUILTIN_INTEGRATIONS: Record<string, IntegrationDefinition> = {
	notion: notionDefinition,
	fal: falDefinition,
	googleCalendar: googleCalendarDefinition,
	gmail: gmailDefinition,
	googleDrive: googleDriveDefinition,
	googleSheets: googleSheetsDefinition,
	microsoftOutlook: microsoftOutlookDefinition,
	geminiMedia: geminiMediaDefinition,
	openaiImages: openaiImagesDefinition,
	discord: discordDefinition,
	slack: slackDefinition,
	telegram: telegramDefinition,
	whatsapp: whatsappDefinition,
	twitter: twitterDefinition,
	instagram: instagramDefinition,
	twilio: twilioDefinition,
	airtable: airtableDefinition,
	tiktok: tiktokDefinition,
	youtube: youtubeDefinition,
	s3: s3Definition,
	shopify: shopifyDefinition,
	stripe: stripeDefinition,
	etsy: etsyDefinition,
	github: githubDefinition,
	dropbox: dropboxDefinition,
	googleAds: googleAdsDefinition,
	metaAds: metaAdsDefinition,
	browserUse: browserUseDefinition,
	httpRequest: httpRequestDefinition,
};

/**
 * The main OpenMolt class.
 *
 * Manages LLM provider configuration, integration registration, and agent creation.
 */
export class OpenMolt {
	private readonly config: OpenMoltConfig;
	private readonly integrations = new Map<string, Integration>();

	/**
	 * Create a new OpenMolt instance.
	 *
	 * @param config - Global configuration including LLM provider API keys,
	 *                 integration configs, max steps, and verbosity.
	 */
	constructor(config: OpenMoltConfig = {}) {
		this.config = config;
		this._registerBuiltins();
	}

	// ─── Public API ───────────────────────────────────────────────────────────

	/**
	 * Register a custom integration (or override an existing one).
	 *
	 * The integration will be available to any agent created after this call
	 * that includes the handle in its `integrations` list.
	 *
	 * @param handle     - Unique identifier for the integration.
	 * @param definition - Integration definition (tools, API setup, scopes, etc.).
	 *
	 * @example
	 * ```typescript
	 * om.registerIntegration('myApi', {
	 *   name: 'My API',
	 *   apiSetup: { baseUrl: 'https://api.example.com' },
	 *   tools: [ ... ],
	 * });
	 * ```
	 */
	registerIntegration(handle: string, definition: IntegrationDefinition): this {
		this.integrations.set(handle, new Integration(handle, definition));
		return this;
	}

	/**
	 * Create a new {@link Agent} instance.
	 *
	 * @param config - Agent configuration.
	 * @returns A fully configured, ready-to-run agent.
	 */
	createAgent(config: AgentConfig): Agent {
		return new Agent(config, this.config, this.integrations);
	}

	/**
	 * Retrieve a registered integration by handle.
	 *
	 * @param handle - Integration handle.
	 */
	getIntegration(handle: string): Integration | undefined {
		return this.integrations.get(handle);
	}

	/**
	 * Returns an array of all registered integration handles.
	 */
	listIntegrations(): string[] {
		return Array.from(this.integrations.keys());
	}

	// ─── Static helpers ───────────────────────────────────────────────────────

	/**
	 * Create a FileSystem integration definition restricted to the given
	 * directories.
	 *
	 * Register the result via {@link registerIntegration}:
	 * ```typescript
	 * om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('/data'));
	 * ```
	 *
	 * @param directories - Allowed base directory or array of directories.
	 */
	static FileSystemIntegration(directories: string | string[]): IntegrationDefinition {
		return createFileSystemIntegration(directories);
	}

	// ─── Private ──────────────────────────────────────────────────────────────

	private _registerBuiltins(): void {
		for (const [handle, def] of Object.entries(BUILTIN_INTEGRATIONS)) {
			this.integrations.set(handle, new Integration(handle, def));
		}
	}
}

export default OpenMolt;
