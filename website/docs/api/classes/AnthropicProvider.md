[**openmolt**](../README.md)

***

[openmolt](../README.md) / AnthropicProvider

# Class: AnthropicProvider

Defined in: [providers/AnthropicProvider.ts:16](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/providers/AnthropicProvider.ts#L16)

Anthropic LLM provider.
Supports all Claude models and extended thinking when enabled via
`modelConfig.thinking = true`.

## Extends

- [`BaseProvider`](BaseProvider.md)

## Constructors

### Constructor

> **new AnthropicProvider**(`apiKey`): `AnthropicProvider`

Defined in: [providers/AnthropicProvider.ts:22](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/providers/AnthropicProvider.ts#L22)

#### Parameters

##### apiKey

`string`

Anthropic API key.

#### Returns

`AnthropicProvider`

#### Overrides

[`BaseProvider`](BaseProvider.md).[`constructor`](BaseProvider.md#constructor)

## Methods

### generate()

> **generate**(`systemPrompt`, `userMessage`, `model`, `config?`): `Promise`\<[`LLMResponse`](../interfaces/LLMResponse.md)\>

Defined in: [providers/AnthropicProvider.ts:28](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/providers/AnthropicProvider.ts#L28)

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
