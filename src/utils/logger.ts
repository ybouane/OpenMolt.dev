/**
 * @module utils/logger
 * Simple levelled logger used throughout OpenMolt.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVELS: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	silent: 4,
};

/** Lightweight logger that respects a configurable minimum log level. */
export class Logger {
	private level: number;
	private prefix: string;

	constructor(prefix = 'OpenMolt', level: LogLevel = 'info') {
		this.prefix = prefix;
		this.level = LEVELS[level];
	}

	/** Change the active log level at runtime. */
	setLevel(level: LogLevel): void {
		this.level = LEVELS[level];
	}

	/** Enable verbose (debug) output. */
	setVerbose(verbose: boolean): void {
		this.level = LEVELS[verbose ? 'debug' : 'info'];
	}

	debug(...args: unknown[]): void {
		if (this.level <= LEVELS.debug) {
			console.debug(`[${this.prefix}]`, ...args);
		}
	}

	info(...args: unknown[]): void {
		if (this.level <= LEVELS.info) {
			console.info(`[${this.prefix}]`, ...args);
		}
	}

	warn(...args: unknown[]): void {
		if (this.level <= LEVELS.warn) {
			console.warn(`[${this.prefix}]`, ...args);
		}
	}

	error(...args: unknown[]): void {
		if (this.level <= LEVELS.error) {
			console.error(`[${this.prefix}]`, ...args);
		}
	}
}

/** Default global logger instance. */
export const logger = new Logger();
