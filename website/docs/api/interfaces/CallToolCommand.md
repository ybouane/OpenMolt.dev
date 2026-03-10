[**openmolt**](../README.md)

***

[openmolt](../README.md) / CallToolCommand

# Interface: CallToolCommand

Defined in: [types/index.ts:273](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L273)

Command: call a tool from a registered integration.

## Properties

### input

> **input**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:280](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L280)

Input object to pass to the tool.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:276](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L276)

Handle of the integration that owns the tool.

***

### tool

> **tool**: `string`

Defined in: [types/index.ts:278](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L278)

Handle of the tool to call.

***

### type

> **type**: `"callTool"`

Defined in: [types/index.ts:274](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L274)
