[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentEventMap

# Type Alias: AgentEventMap

> **AgentEventMap** = `object`

Defined in: [types/index.ts:400](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L400)

Union of all agent events for use with `agent.on(...)`.

## Properties

### commandsQueued

> **commandsQueued**: `object`

Defined in: [types/index.ts:404](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L404)

Fired after the commands for a step are parsed but before execution.

#### commands

> **commands**: [`AgentCommand`](AgentCommand.md)[]

***

### finish

> **finish**: `object`

Defined in: [types/index.ts:415](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L415)

Fired when the agent issues a `finish` command.

#### result

> **result**: `unknown`

***

### llmOutput

> **llmOutput**: `object`

Defined in: [types/index.ts:402](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L402)

Fired after every raw LLM response.

#### output

> **output**: [`LLMResponse`](../interfaces/LLMResponse.md)

***

### planUpdate

> **planUpdate**: `object`

Defined in: [types/index.ts:413](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L413)

Fired whenever the agent updates its plan.

#### plan

> **plan**: [`PlanStep`](../interfaces/PlanStep.md)[]

***

### tool:call

> **tool:call**: `object`

Defined in: [types/index.ts:406](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L406)

Fired just before a tool is executed.

#### tool

> **tool**: `object`

##### tool.handle

> **handle**: `string`

##### tool.input

> **input**: `Record`\<`string`, `unknown`\>

##### tool.integration

> **integration**: `string`

***

### tool:response

> **tool:response**: `object`

Defined in: [types/index.ts:408](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L408)

Fired after a tool returns.

#### response

> **response**: `unknown`

#### tool

> **tool**: `object`

##### tool.handle

> **handle**: `string`

##### tool.input

> **input**: `Record`\<`string`, `unknown`\>

##### tool.integration

> **integration**: `string`
