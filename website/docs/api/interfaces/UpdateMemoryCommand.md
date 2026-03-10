[**openmolt**](../README.md)

***

[openmolt](../README.md) / UpdateMemoryCommand

# Interface: UpdateMemoryCommand

Defined in: [types/index.ts:297](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L297)

Command: update long-term or short-term memory.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:302](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L302)

***

### memoryType

> **memoryType**: `"longTerm"` \| `"shortTerm"`

Defined in: [types/index.ts:299](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L299)

***

### mode

> **mode**: `"replace"` \| `"append"`

Defined in: [types/index.ts:301](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L301)

`replace` overwrites the entire memory; `append` concatenates to existing content.

***

### type

> **type**: `"updateMemory"`

Defined in: [types/index.ts:298](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L298)
