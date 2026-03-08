[**openmolt**](../README.md)

***

[openmolt](../README.md) / OpenAIProvider

# Class: OpenAIProvider

Defined in: [providers/OpenAIProvider.ts:23](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/providers/OpenAIProvider.ts#L23)

OpenAI LLM provider.
Supports chat-completion models (GPT-4o, GPT-3.5, etc.) and
reasoning models (o1, o3 family).

## Extends

- [`BaseProvider`](BaseProvider.md)

## Constructors

### Constructor

> **new OpenAIProvider**(`apiKey`, `baseUrl?`): `OpenAIProvider`

Defined in: [providers/OpenAIProvider.ts:30](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/providers/OpenAIProvider.ts#L30)

#### Parameters

##### apiKey

`string`

OpenAI API key.

##### baseUrl?

`string`

Override for the API base URL (useful for proxies / Azure).

#### Returns

`OpenAIProvider`

#### Overrides

[`BaseProvider`](BaseProvider.md).[`constructor`](BaseProvider.md#constructor)

## Methods

### generate()

> **generate**(`systemPrompt`, `userMessage`, `model`, `config?`): `Promise`\<[`LLMResponse`](../interfaces/LLMResponse.md)\>

Defined in: [providers/OpenAIProvider.ts:39](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/providers/OpenAIProvider.ts#L39)

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
