[**openmolt**](../README.md)

***

[openmolt](../README.md) / LLMResponse

# Interface: LLMResponse

Defined in: [types/index.ts:382](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L382)

Normalised response returned by any LLMProvider.

## Properties

### content

> **content**: `string`

Defined in: [types/index.ts:384](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L384)

The text content of the response.

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [types/index.ts:394](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L394)

Raw provider response object.

***

### thinking?

> `optional` **thinking**: `string`

Defined in: [types/index.ts:386](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L386)

Optional chain-of-thought / reasoning produced by the model.

***

### usage?

> `optional` **usage**: `object`

Defined in: [types/index.ts:388](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L388)

Token usage statistics.

#### completionTokens

> **completionTokens**: `number`

#### promptTokens

> **promptTokens**: `number`

#### totalTokens

> **totalTokens**: `number`
