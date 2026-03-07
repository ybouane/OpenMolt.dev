[**openmolt**](../README.md)

***

[openmolt](../README.md) / LLMResponse

# Interface: LLMResponse

Defined in: [types/index.ts:375](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L375)

Normalised response returned by any LLMProvider.

## Properties

### content

> **content**: `string`

Defined in: [types/index.ts:377](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L377)

The text content of the response.

***

### raw?

> `optional` **raw**: `unknown`

Defined in: [types/index.ts:387](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L387)

Raw provider response object.

***

### thinking?

> `optional` **thinking**: `string`

Defined in: [types/index.ts:379](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L379)

Optional chain-of-thought / reasoning produced by the model.

***

### usage?

> `optional` **usage**: `object`

Defined in: [types/index.ts:381](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L381)

Token usage statistics.

#### completionTokens

> **completionTokens**: `number`

#### promptTokens

> **promptTokens**: `number`

#### totalTokens

> **totalTokens**: `number`
