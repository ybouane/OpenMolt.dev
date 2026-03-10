[**openmolt**](../README.md)

***

[openmolt](../README.md) / OpenMoltConfig

# Interface: OpenMoltConfig

Defined in: [types/index.ts:17](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L17)

Top-level OpenMolt configuration.

## Properties

### integrations?

> `optional` **integrations**: `Record`\<`string`, `Record`\<`string`, `unknown`\>\>

Defined in: [types/index.ts:25](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L25)

Built-in integration configurations keyed by integration handle.

***

### llmProviders?

> `optional` **llmProviders**: `object`

Defined in: [types/index.ts:19](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L19)

LLM provider configurations keyed by provider name.

#### anthropic?

> `optional` **anthropic**: [`LLMProviderConfig`](LLMProviderConfig.md)

#### google?

> `optional` **google**: [`LLMProviderConfig`](LLMProviderConfig.md)

#### openai?

> `optional` **openai**: [`LLMProviderConfig`](LLMProviderConfig.md)

***

### maxSteps?

> `optional` **maxSteps**: `number`

Defined in: [types/index.ts:27](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L27)

Maximum number of agent loop iterations before stopping. Defaults to 20.

***

### verbose?

> `optional` **verbose**: `boolean`

Defined in: [types/index.ts:29](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L29)

Enable verbose logging.
