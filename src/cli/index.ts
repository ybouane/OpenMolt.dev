#!/usr/bin/env node
/**
 * @module cli
 * OpenMolt CLI – run an agent from a JSON or JS config file.
 *
 * Usage:
 *   npx openmolt agentConfig.json
 *   npx openmolt agentConfig.js
 *   npx openmolt --help
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, extname } from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

// Load .env file if present
try {
	const { config } = await import('dotenv');
	config();
} catch { /* dotenv optional */ }

// ─── CLI helpers ──────────────────────────────────────────────────────────────

function printHelp(): void {
	console.log(`
OpenMolt – Programmatic AI Agent System
Usage: openmolt <configFile> [options]

Arguments:
  configFile     Path to a JSON or JS/MJS agent configuration file.

Options:
  --input <str>  Initial input to pass to the agent's run() method.
  --dry-run      Parse and validate config without running the agent.
  --verbose      Enable verbose logging.
  --help         Show this help message.

Config file format (JSON):
  {
    "llmProviders": {
      "openai":    { "apiKey": "..." },
      "anthropic": { "apiKey": "..." },
      "google":    { "apiKey": "..." }
    },
    "integrations": { ... },
    "maxSteps": 20,
    "verbose": false,
    "agent": {
      "name": "My Agent",
      "model": "openai:gpt-4o",
      "instructions": "...",
      "integrations": [ ... ],
      "schedules": [ ... ]
    },
    "input": "Initial task input"
  }

API keys can also be provided via environment variables:
  OPENMOLT_OPENAI_API_KEY, OPENMOLT_ANTHROPIC_API_KEY, OPENMOLT_GOOGLE_API_KEY
`);
}

// ─── Arg parsing ──────────────────────────────────────────────────────────────

interface CliArgs {
	configPath: string | null;
	input: string | null;
	dryRun: boolean;
	verbose: boolean;
	help: boolean;
}

function parseArgs(argv: string[]): CliArgs {
	const args = argv.slice(2);
	const result: CliArgs = {
		configPath: null,
		input: null,
		dryRun: false,
		verbose: false,
		help: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--help' || arg === '-h') {
			result.help = true;
		} else if (arg === '--dry-run') {
			result.dryRun = true;
		} else if (arg === '--verbose') {
			result.verbose = true;
		} else if (arg === '--input' || arg === '-i') {
			result.input = args[++i] ?? null;
		} else if (!arg.startsWith('--')) {
			result.configPath = arg;
		}
	}

	return result;
}

// ─── Config loading ───────────────────────────────────────────────────────────

interface AgentCliConfig {
	llmProviders?: Record<string, { apiKey?: string }>;
	integrations?: Record<string, Record<string, unknown>>;
	maxSteps?: number;
	verbose?: boolean;
	agent: {
		name: string;
		model: string;
		instructions?: string;
		instructionsPath?: string;
		modelConfig?: Record<string, unknown>;
		integrations?: unknown[];
		memory?: unknown;
		outputSchema?: unknown;
		schedules?: unknown[];
	};
	input?: unknown;
}

async function loadConfig(configPath: string): Promise<AgentCliConfig> {
	const absPath = resolve(configPath);
	if (!existsSync(absPath)) {
		throw new Error(`Config file not found: ${absPath}`);
	}

	const ext = extname(absPath).toLowerCase();

	if (ext === '.json') {
		const raw = readFileSync(absPath, 'utf-8');
		return JSON.parse(raw) as AgentCliConfig;
	}

	if (ext === '.js' || ext === '.mjs' || ext === '.cjs' || ext === '.ts') {
		try {
			// Dynamic import for ESM modules
			const fileUrl = pathToFileURL(absPath).href;
			const mod = await import(fileUrl);
			return (mod.default ?? mod) as AgentCliConfig;
		} catch {
			// Fallback to require for CJS
			const req = createRequire(import.meta.url);
			return req(absPath) as AgentCliConfig;
		}
	}

	throw new Error(`Unsupported config file type: ${ext}. Use .json, .js, or .mjs`);
}

// ─── Schedule helpers ─────────────────────────────────────────────────────────

import type { ScheduleConfig } from '../types/index.js';

function parseSchedule(raw: Record<string, unknown>): ScheduleConfig {
	if (raw.type === 'interval') {
		return { type: 'interval', value: Number(raw.value) };
	}
	if (raw.type === 'daily') {
		const s: ScheduleConfig = {
			type: 'daily',
			hour: Number(raw.hour ?? 0),
			minute: Number(raw.minute ?? 0),
		};
		if (raw.dayOfWeek) (s as { dayOfWeek?: number[] }).dayOfWeek = raw.dayOfWeek as number[];
		if (raw.dayOfMonth) (s as { dayOfMonth?: number[] }).dayOfMonth = raw.dayOfMonth as number[];
		if (raw.timeZone) (s as { timeZone?: string }).timeZone = raw.timeZone as string;
		return s;
	}
	throw new Error(`Unknown schedule type: ${raw.type}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
	const args = parseArgs(process.argv);

	if (args.help || !args.configPath) {
		printHelp();
		process.exit(args.help ? 0 : 1);
	}

	// Load config
	let config: AgentCliConfig;
	try {
		config = await loadConfig(args.configPath);
	} catch (err) {
		console.error(`Error loading config: ${String(err)}`);
		process.exit(1);
	}

	if (!config.agent) {
		console.error('Config file must contain an "agent" property.');
		process.exit(1);
	}

	// Override verbose flag
	if (args.verbose) config.verbose = true;

	if (args.dryRun) {
		console.log('Dry run – config parsed successfully:');
		console.log(JSON.stringify({ agent: config.agent.name, model: config.agent.model }, null, 2));
		process.exit(0);
	}

	// Lazy import OpenMolt (avoids loading all integrations on --help)
	const { OpenMolt } = await import('../OpenMolt.js');

	const om = new OpenMolt({
		llmProviders: config.llmProviders,
		integrations: config.integrations,
		maxSteps: config.maxSteps,
		verbose: config.verbose ?? args.verbose,
	});

	// Build agent config
	const agentCfg = config.agent;

	const agent = om.createAgent({
		name: agentCfg.name,
		model: agentCfg.model,
		instructions: agentCfg.instructions,
		instructionsPath: agentCfg.instructionsPath,
		modelConfig: agentCfg.modelConfig as Record<string, unknown>,
		integrations: agentCfg.integrations as never,
		memory: agentCfg.memory as never,
	});

	// Register schedules
	const scheduleIds: string[] = [];
	if (Array.isArray(agentCfg.schedules) && agentCfg.schedules.length > 0) {
		console.log(`Registering ${agentCfg.schedules.length} schedule(s)…`);
		for (const rawSched of agentCfg.schedules) {
			try {
				const sched = parseSchedule(rawSched as Record<string, unknown>);
				const id = agent.schedule(sched);
				scheduleIds.push(id);
				console.log(`  ✓ Schedule registered: ${id} (${JSON.stringify(sched)})`);
			} catch (err) {
				console.warn(`  ⚠ Invalid schedule: ${String(err)}`);
			}
		}

		if (scheduleIds.length > 0) {
			console.log('Agent is running on schedule. Press Ctrl+C to stop.');
			// Keep process alive
			process.on('SIGINT', () => {
				console.log('\nStopping scheduled agent…');
				process.exit(0);
			});
			// Run indefinitely
			await new Promise(() => {});
			return;
		}
	}

	// Single run
	const input = args.input ?? config.input ?? null;
	console.log(`Running agent "${agentCfg.name}" (${agentCfg.model})…`);

	agent.on('planUpdate', (e) => {
		const active = e.plan.find((s) => s.status === 'inProgress');
		if (active) console.log(`  ▶ ${active.name}`);
	});

	agent.on('tool:call', (e) => {
		console.log(`  🔧 ${e.tool.integration}.${e.tool.handle}`);
	});

	try {
		const result = await agent.run(input);
		console.log('\n✅ Agent finished successfully.');
		console.log(JSON.stringify(result, null, 2));
		process.exit(0);
	} catch (err) {
		console.error('\n❌ Agent failed:', String(err));
		process.exit(1);
	}
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
