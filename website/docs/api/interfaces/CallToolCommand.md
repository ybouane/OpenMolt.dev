[**openmolt**](../README.md)

***

[openmolt](../README.md) / CallToolCommand

# Interface: CallToolCommand

Defined in: [types/index.ts:280](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L280)

Command: call a tool from a registered integration.

## Properties

### input

> **input**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:287](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L287)

Input object to pass to the tool.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:283](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L283)

Handle of the integration that owns the tool.

***

### tool

> **tool**: `string`

Defined in: [types/index.ts:285](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L285)

Handle of the tool to call.

***

### type

> **type**: `"callTool"`

Defined in: [types/index.ts:281](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L281)
