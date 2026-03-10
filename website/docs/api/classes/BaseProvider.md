[**openmolt**](../README.md)

***

[openmolt](../README.md) / BaseProvider

# Abstract Class: BaseProvider

Defined in: [providers/BaseProvider.ts:15](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/providers/BaseProvider.ts#L15)

Abstract base for all language-model providers.
Implementations are responsible for translating the normalised
`systemPrompt` / `userMessage` / `config` inputs into the provider's own
API format and returning a normalised [LLMResponse](../interfaces/LLMResponse.md).

## Extended by

- [`OpenAIProvider`](OpenAIProvider.md)
- [`AnthropicProvider`](AnthropicProvider.md)
- [`GoogleProvider`](GoogleProvider.md)

## Constructors

### Constructor

> **new BaseProvider**(): `BaseProvider`

#### Returns

`BaseProvider`

## Methods

### generate()

> `abstract` **generate**(`systemPrompt`, `userMessage`, `model`, `config?`): `Promise`\<[`LLMResponse`](../interfaces/LLMResponse.md)\>

Defined in: [providers/BaseProvider.ts:24](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/providers/BaseProvider.ts#L24)

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
