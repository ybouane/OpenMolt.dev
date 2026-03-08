[**openmolt**](../README.md)

***

[openmolt](../README.md) / ToolContext

# Interface: ToolContext

Defined in: [types/index.ts:113](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L113)

Tool execution context passed to `execute` functions.

## Properties

### agentName

> **agentName**: `string`

Defined in: [types/index.ts:115](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L115)

Name of the agent executing the tool.

***

### config?

> `optional` **config**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:119](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L119)

Resolved credential config for the current agent.

***

### integrationHandle

> **integrationHandle**: `string`

Defined in: [types/index.ts:117](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L117)

Handle of the integration this tool belongs to.
