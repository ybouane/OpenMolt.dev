[**openmolt**](../README.md)

***

[openmolt](../README.md) / GoogleProvider

# Class: GoogleProvider

Defined in: [providers/GoogleProvider.ts:17](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/providers/GoogleProvider.ts#L17)

Google Generative AI (Gemini) LLM provider.
Supports Gemini 2.0+, including thinking (Gemini 2.5) and
live search grounding.

## Extends

- [`BaseProvider`](BaseProvider.md)

## Constructors

### Constructor

> **new GoogleProvider**(`apiKey`): `GoogleProvider`

Defined in: [providers/GoogleProvider.ts:23](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/providers/GoogleProvider.ts#L23)

#### Parameters

##### apiKey

`string`

Google API key with Generative Language API access.

#### Returns

`GoogleProvider`

#### Overrides

[`BaseProvider`](BaseProvider.md).[`constructor`](BaseProvider.md#constructor)

## Methods

### generate()

> **generate**(`systemPrompt`, `userMessage`, `model`, `config?`): `Promise`\<[`LLMResponse`](../interfaces/LLMResponse.md)\>

Defined in: [providers/GoogleProvider.ts:29](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/providers/GoogleProvider.ts#L29)

Send a prompt to the underlying LLM and return a normalised response.

#### Parameters

##### systemPrompt

`string`

The Maestro system prompt (static across iterations).

##### userMessage

`string`

The per-iteration input-state message.

##### model

`string`

Provider-specific model identifier (e.g. `gpt-4o`).

##### config?

[`ModelConfig`](../interfaces/ModelConfig.md)

Optional model-level tuning parameters.

#### Returns

`Promise`\<[`LLMResponse`](../interfaces/LLMResponse.md)\>

#### Overrides

[`BaseProvider`](BaseProvider.md).[`generate`](BaseProvider.md#generate)
