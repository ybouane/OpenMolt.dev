[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentEventMap

# Type Alias: AgentEventMap

> **AgentEventMap** = `object`

Defined in: [types/index.ts:393](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L393)

Union of all agent events for use with `agent.on(...)`.

## Properties

### commandsQueued

> **commandsQueued**: `object`

Defined in: [types/index.ts:397](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L397)

Fired after the commands for a step are parsed but before execution.

#### commands

> **commands**: [`AgentCommand`](AgentCommand.md)[]

***

### finish

> **finish**: `object`

Defined in: [types/index.ts:408](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L408)

Fired when the agent issues a `finish` command.

#### result

> **result**: `unknown`

***

### llmOutput

> **llmOutput**: `object`

Defined in: [types/index.ts:395](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L395)

Fired after every raw LLM response.

#### output

> **output**: [`LLMResponse`](../interfaces/LLMResponse.md)

***

### planUpdate

> **planUpdate**: `object`

Defined in: [types/index.ts:406](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L406)

Fired whenever the agent updates its plan.

#### plan

> **plan**: [`PlanStep`](../interfaces/PlanStep.md)[]

***

### tool:call

> **tool:call**: `object`

Defined in: [types/index.ts:399](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L399)

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

Defined in: [types/index.ts:401](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L401)

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
