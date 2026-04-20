[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentConfig

# Interface: AgentConfig

Defined in: [types/index.ts:251](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L251)

Full configuration object for creating an agent via `om.createAgent()`.

## Properties

### config?

> `optional` **config**: `Partial`\<[`OpenMoltConfig`](OpenMoltConfig.md)\>

Defined in: [types/index.ts:259](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L259)

Override top-level OpenMolt configuration for this agent.

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [types/index.ts:261](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L261)

System instructions that guide the agent's behaviour (inline).

***

### instructionsPath?

> `optional` **instructionsPath**: `string`

Defined in: [types/index.ts:263](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L263)

Path to a Markdown file containing the agent's instructions.

***

### integrations?

> `optional` **integrations**: [`AgentIntegrationConfig`](AgentIntegrationConfig.md)[]

Defined in: [types/index.ts:265](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L265)

Integrations the agent is allowed to use.

***

### memory?

> `optional` **memory**: [`MemoryConfig`](MemoryConfig.md)

Defined in: [types/index.ts:267](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L267)

Memory configuration.

***

### model

> **model**: `string`

Defined in: [types/index.ts:255](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L255)

Model identifier in the format `provider:model-name` (e.g. `openai:gpt-4o`).

***

### modelConfig?

> `optional` **modelConfig**: [`ModelConfig`](ModelConfig.md)

Defined in: [types/index.ts:257](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L257)

Per-call model configuration (temperature, thinking, etc.).

***

### name

> **name**: `string`

Defined in: [types/index.ts:253](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L253)

Display name of the agent.

***

### onHumanInputRequest?

> `optional` **onHumanInputRequest**: `false` \| (`prompt`) => `Promise`\<`string`\>

Defined in: [types/index.ts:272](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L272)

Called when the agent issues a `requestHumanInput` command.
Return the user's reply as a string. Set to `false` to disable human input.

***

### outputSchema?

> `optional` **outputSchema**: `ZodTypeAny`

Defined in: [types/index.ts:274](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L274)

Zod schema the agent's `finish` output must conform to.
