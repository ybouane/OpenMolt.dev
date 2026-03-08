[**openmolt**](../README.md)

***

[openmolt](../README.md) / CallToolCommand

# Interface: CallToolCommand

Defined in: [types/index.ts:273](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L273)

Command: call a tool from a registered integration.

## Properties

### input

> **input**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:280](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L280)

Input object to pass to the tool.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:276](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L276)

Handle of the integration that owns the tool.

***

### tool

> **tool**: `string`

Defined in: [types/index.ts:278](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L278)

Handle of the tool to call.

***

### type

> **type**: `"callTool"`

Defined in: [types/index.ts:274](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L274)
