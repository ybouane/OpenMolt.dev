/**
 * @module utils/liquid
 * Liquid template rendering utilities used for injecting variables into
 * integration API configurations and credential headers.
 */

import { Liquid } from 'liquidjs';

/** Shared LiquidJS engine instance. */
const engine = new Liquid({
	strictVariables: false,
	strictFilters: false,
	trimTagRight: false,
	trimTagLeft: false,
});

/**
 * Regex that matches an *entire* string that is a single Liquid expression
 * referencing the `input` scope, e.g. `{{ input.someField }}`.
 * Used for type-preserving direct substitution.
 */
const DIRECT_INPUT_TEMPLATE_RE = /^\{\{\s*input\.([a-zA-Z0-9_.[\]]+)\s*\}\}$/;

/**
 * Regex that matches an *entire* string that is a single Liquid expression
 * referencing the `config` scope, e.g. `{{ config.apiKey }}`.
 */
const DIRECT_CONFIG_TEMPLATE_RE = /^\{\{\s*config\.([a-zA-Z0-9_.[\]]+)\s*\}\}$/;

/**
 * Retrieve a nested value from an object using dot-notation path.
 *
 * @example
 * getNestedValue({ a: { b: 42 } }, 'a.b') // → 42
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
	return path.split('.').reduce<unknown>((acc, key) => {
		if (acc == null || typeof acc !== 'object') return undefined;
		return (acc as Record<string, unknown>)[key];
	}, obj);
}

/**
 * Render a single string value using LiquidJS with the provided context.
 * If the string is *exactly* `{{ input.someField }}` or `{{ config.someField }}`,
 * the original JavaScript value is returned without coercing it to a string,
 * preserving the original type (number, boolean, array, etc.).
 *
 * @param template - The string to render.
 * @param context - Combined variable context passed to the Liquid engine.
 */
async function renderString(template: string, context: Record<string, unknown>): Promise<unknown> {
	if (typeof template !== 'string') return template;

	// Direct input substitution – preserves original type
	const inputMatch = template.match(DIRECT_INPUT_TEMPLATE_RE);
	if (inputMatch && context.input) {
		const value = getNestedValue(context.input as Record<string, unknown>, inputMatch[1]);
		if (value !== undefined) return value;
	}

	// Direct config substitution – preserves original type
	const configMatch = template.match(DIRECT_CONFIG_TEMPLATE_RE);
	if (configMatch && context.config) {
		const value = getNestedValue(context.config as Record<string, unknown>, configMatch[1]);
		if (value !== undefined) return value;
	}

	// General Liquid rendering (always returns a string)
	try {
		return await engine.parseAndRender(template, context);
	} catch {
		return template;
	}
}

/**
 * Recursively walk a value (object, array, or scalar) and render every
 * string leaf using LiquidJS with the given context.
 *
 * @param value - The value to process.
 * @param context - Variable context for Liquid rendering.
 */
export async function renderValue(
	value: unknown,
	context: Record<string, unknown>,
): Promise<unknown> {
	if (typeof value === 'string') {
		return renderString(value, context);
	}
	if (Array.isArray(value)) {
		return Promise.all(value.map((item) => renderValue(item, context)));
	}
	if (value !== null && typeof value === 'object') {
		const result: Record<string, unknown> = {};
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			result[k] = await renderValue(v, context);
		}
		return result;
	}
	return value;
}

/**
 * Render an object's values with a `config` context (used for credential
 * header / query-param templates such as `Authorization: Bearer {{ config.apiKey }}`).
 *
 * @param obj - The object to render.
 * @param config - Integration credential config values.
 */
export async function renderWithConfig(
	obj: Record<string, unknown>,
	config: Record<string, unknown>,
): Promise<Record<string, string>> {
	const rendered = await renderValue(obj, { config });
	return rendered as Record<string, string>;
}

/**
 * Render an object's values with an `input` context (used for tool endpoint,
 * body, and query-parameter templates such as `{{ input.userId }}`).
 *
 * @param obj - The object to render.
 * @param input - Tool input values.
 * @param config - Optional integration config values (also available as `config.*`).
 */
export async function renderWithInput(
	obj: Record<string, unknown>,
	input: Record<string, unknown>,
	config?: Record<string, unknown>,
): Promise<unknown> {
	return renderValue(obj, { input, config: config ?? {} });
}

/**
 * Render a single string template with both input and config contexts.
 *
 * @param template - The Liquid template string.
 * @param input - Tool input values.
 * @param config - Integration credential config values.
 */
export async function renderTemplate(
	template: string,
	input: Record<string, unknown>,
	config?: Record<string, unknown>,
): Promise<string> {
	const result = await renderString(template, { input, config: config ?? {} });
	return String(result);
}
