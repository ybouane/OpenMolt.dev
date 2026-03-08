[**openmolt**](../README.md)

***

[openmolt](../README.md) / ModelConfig

# Interface: ModelConfig

Defined in: [types/index.ts:33](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L33)

Per-call model configuration passed to the LLM provider.

## Indexable

\[`key`: `string`\]: `unknown`

Any additional provider-specific options.

## Properties

### maxTokens?

> `optional` **maxTokens**: `number`

Defined in: [types/index.ts:41](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L41)

Maximum output tokens.

***

### search?

> `optional` **search**: `boolean`

Defined in: [types/index.ts:37](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L37)

Enable web search grounding (Gemini).

***

### temperature?

> `optional` **temperature**: `number`

Defined in: [types/index.ts:39](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L39)

Sampling temperature (0–2).

***

### thinking?

> `optional` **thinking**: `boolean`

Defined in: [types/index.ts:35](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L35)

Enable the model's extended thinking / reasoning process.
