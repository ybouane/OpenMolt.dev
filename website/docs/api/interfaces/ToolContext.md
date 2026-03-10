[**openmolt**](../README.md)

***

[openmolt](../README.md) / ToolContext

# Interface: ToolContext

Defined in: [types/index.ts:113](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L113)

Tool execution context passed to `execute` functions.

## Properties

### agentName

> **agentName**: `string`

Defined in: [types/index.ts:115](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L115)

Name of the agent executing the tool.

***

### config?

> `optional` **config**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:119](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L119)

Resolved credential config for the current agent.

***

### integrationHandle

> **integrationHandle**: `string`

Defined in: [types/index.ts:117](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L117)

Handle of the integration this tool belongs to.
