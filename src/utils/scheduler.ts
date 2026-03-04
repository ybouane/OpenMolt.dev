/**
 * @module utils/scheduler
 * Scheduling utilities for interval-based and daily-cron-style agent execution.
 */

import type { ScheduleConfig, IntervalSchedule, DailySchedule } from '../types/index.js';

/** Opaque identifier returned by {@link Scheduler.add}. */
export type ScheduleId = string;

type ScheduleCallback = () => void | Promise<void>;

interface ScheduleEntry {
	id: ScheduleId;
	config: ScheduleConfig;
	callback: ScheduleCallback;
	timer?: ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;
}

let _nextId = 1;
function nextId(): ScheduleId {
	return `sched_${_nextId++}`;
}

/**
 * Manages a collection of named schedules, supporting both fixed-interval and
 * wall-clock daily triggers.
 */
export class Scheduler {
	private entries: Map<ScheduleId, ScheduleEntry> = new Map();

	/**
	 * Register a new schedule and start it immediately.
	 *
	 * @param config  - The schedule configuration.
	 * @param callback - Function to invoke on each trigger.
	 * @returns A unique schedule ID that can be passed to {@link cancel}.
	 */
	add(config: ScheduleConfig, callback: ScheduleCallback): ScheduleId {
		const id = nextId();
		const entry: ScheduleEntry = { id, config, callback };
		this.entries.set(id, entry);

		if (config.type === 'interval') {
			this._startInterval(entry, config);
		} else {
			this._startDaily(entry, config);
		}

		return id;
	}

	/** Cancel and remove a schedule by ID. */
	cancel(id: ScheduleId): boolean {
		const entry = this.entries.get(id);
		if (!entry) return false;

		if (entry.timer != null) {
			clearTimeout(entry.timer as ReturnType<typeof setTimeout>);
			clearInterval(entry.timer as ReturnType<typeof setInterval>);
		}

		this.entries.delete(id);
		return true;
	}

	/** Cancel all active schedules. */
	cancelAll(): void {
		for (const id of this.entries.keys()) {
			this.cancel(id);
		}
	}

	// ── Private helpers ──────────────────────────────────────────────────────

	private _startInterval(entry: ScheduleEntry, config: IntervalSchedule): void {
		entry.timer = setInterval(async () => {
			try {
				await entry.callback();
			} catch (err) {
				console.error(`[Scheduler] Error in schedule ${entry.id}:`, err);
			}
		}, config.value * 1000);
	}

	private _startDaily(entry: ScheduleEntry, config: DailySchedule): void {
		const tick = async () => {
			if (this._shouldRunNow(config)) {
				try {
					await entry.callback();
				} catch (err) {
					console.error(`[Scheduler] Error in schedule ${entry.id}:`, err);
				}
			}
			// Re-schedule for next minute check
			if (this.entries.has(entry.id)) {
				entry.timer = setTimeout(tick, this._msUntilNextMinute());
			}
		};

		entry.timer = setTimeout(tick, this._msUntilNextMinute());
	}

	/**
	 * Determine whether a daily schedule should fire at the current wall-clock time.
	 * Checks the minute, hour, and day constraints.
	 */
	private _shouldRunNow(config: DailySchedule): boolean {
		const now = config.timeZone
			? new Date(new Date().toLocaleString('en-US', { timeZone: config.timeZone }))
			: new Date();

		if (now.getHours() !== config.hour) return false;
		if (now.getMinutes() !== config.minute) return false;

		if (config.dayOfWeek && config.dayOfWeek.length > 0) {
			if (!config.dayOfWeek.includes(now.getDay())) return false;
		}

		if (config.dayOfMonth && config.dayOfMonth.length > 0) {
			if (!config.dayOfMonth.includes(now.getDate())) return false;
		}

		return true;
	}

	/** Milliseconds until the start of the next calendar minute. */
	private _msUntilNextMinute(): number {
		const now = new Date();
		const ms =
			(60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 100; /* small buffer */
		return Math.max(ms, 1000);
	}
}
