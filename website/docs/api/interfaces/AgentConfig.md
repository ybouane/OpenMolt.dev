[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentConfig

# Interface: AgentConfig

Defined in: [types/index.ts:244](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L244)

Full configuration object for creating an agent via `om.createAgent()`.

## Properties

### config?

> `optional` **config**: `Partial`\<[`OpenMoltConfig`](OpenMoltConfig.md)\>

Defined in: [types/index.ts:252](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L252)

Override top-level OpenMolt configuration for this agent.

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [types/index.ts:254](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L254)

System instructions that guide the agent's behaviour (inline).

***

### instructionsPath?

> `optional` **instructionsPath**: `string`

Defined in: [types/index.ts:256](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L256)

Path to a Markdown file containing the agent's instructions.

***

### integrations?

> `optional` **integrations**: [`AgentIntegrationConfig`](AgentIntegrationConfig.md)[]

Defined in: [types/index.ts:258](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L258)

Integrations the agent is allowed to use.

***

### memory?

> `optional` **memory**: [`MemoryConfig`](MemoryConfig.md)

Defined in: [types/index.ts:260](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L260)

Memory configuration.

***

### model

> **model**: `string`

Defined in: [types/index.ts:248](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L248)

Model identifier in the format `provider:model-name` (e.g. `openai:gpt-4o`).

***

### modelConfig?

> `optional` **modelConfig**: [`ModelConfig`](ModelConfig.md)

Defined in: [types/index.ts:250](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L250)

Per-call model configuration (temperature, thinking, etc.).

***

### name

> **name**: `string`

Defined in: [types/index.ts:246](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L246)

Display name of the agent.

***

### onHumanInputRequest?

> `optional` **onHumanInputRequest**: `false` \| (`prompt`) => `Promise`\<`string`\>

Defined in: [types/index.ts:265](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L265)

Called when the agent issues a `requestHumanInput` command.
Return the user's reply as a string. Set to `false` to disable human input.

***

### outputSchema?

> `optional` **outputSchema**: `ZodTypeAny`

Defined in: [types/index.ts:267](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L267)

Zod schema the agent's `finish` output must conform to.
