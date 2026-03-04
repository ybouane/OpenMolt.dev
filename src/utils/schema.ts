/**
 * @module utils/schema
 * Utilities for converting Zod schemas to human-readable JSON-Schema-like
 * descriptions that are embedded in the agent's system prompt.
 */

import { ZodTypeAny, ZodObject, ZodString, ZodNumber, ZodBoolean, ZodArray, ZodOptional, ZodNullable, ZodEnum, ZodUnion, ZodLiteral, ZodDefault, ZodEffects } from 'zod';

/** A simplified JSON-Schema-like representation. */
export type SimpleSchema =
	| { type: 'string'; description?: string; enum?: string[] }
	| { type: 'number'; description?: string }
	| { type: 'boolean'; description?: string }
	| { type: 'array'; items: SimpleSchema; description?: string }
	| { type: 'object'; properties: Record<string, SimpleSchema>; required?: string[]; description?: string }
	| { type: 'any'; description?: string }
	| { anyOf: SimpleSchema[]; description?: string };

/**
 * Convert a Zod schema to a simplified JSON-Schema-like object suitable for
 * inclusion in prompts.
 */
export function zodToSimple(schema: ZodTypeAny): SimpleSchema {
	const def = schema._def as Record<string, unknown>;
	const description = (def.description as string | undefined) ?? undefined;

	// Unwrap optional / nullable / default / effects
	if (schema instanceof ZodOptional || schema instanceof ZodNullable || schema instanceof ZodDefault) {
		const inner = zodToSimple((def.innerType ?? def.schema) as ZodTypeAny);
		return description ? { ...inner, description } : inner;
	}

	if (schema instanceof ZodEffects) {
		return zodToSimple((def.schema) as ZodTypeAny);
	}

	if (schema instanceof ZodString) {
		return { type: 'string', description };
	}

	if (schema instanceof ZodNumber) {
		return { type: 'number', description };
	}

	if (schema instanceof ZodBoolean) {
		return { type: 'boolean', description };
	}

	if (schema instanceof ZodLiteral) {
		return { type: 'string', enum: [String(def.value)], description };
	}

	if (schema instanceof ZodEnum) {
		return { type: 'string', enum: (def.values as string[]), description };
	}

	if (schema instanceof ZodArray) {
		return { type: 'array', items: zodToSimple(def.type as ZodTypeAny), description };
	}

	if (schema instanceof ZodObject) {
		const shape = (def.shape as () => Record<string, ZodTypeAny>)();
		const properties: Record<string, SimpleSchema> = {};
		const required: string[] = [];

		for (const [key, value] of Object.entries(shape)) {
			properties[key] = zodToSimple(value as ZodTypeAny);
			if (!(value instanceof ZodOptional) && !(value instanceof ZodNullable)) {
				required.push(key);
			}
		}

		return { type: 'object', properties, required, description };
	}

	if (schema instanceof ZodUnion) {
		return { anyOf: (def.options as ZodTypeAny[]).map(zodToSimple), description };
	}

	return { type: 'any', description };
}

/** Serialise a Zod schema to a compact JSON string for embedding in prompts. */
export function schemaToString(schema: ZodTypeAny | undefined): string {
	if (!schema) return '{}';
	return JSON.stringify(zodToSimple(schema), null, 2);
}
