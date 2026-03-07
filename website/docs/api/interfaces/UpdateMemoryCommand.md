[**openmolt**](../README.md)

***

[openmolt](../README.md) / UpdateMemoryCommand

# Interface: UpdateMemoryCommand

Defined in: [types/index.ts:297](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L297)

Command: update long-term or short-term memory.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:302](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L302)

***

### memoryType

> **memoryType**: `"longTerm"` \| `"shortTerm"`

Defined in: [types/index.ts:299](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L299)

***

### mode

> **mode**: `"replace"` \| `"append"`

Defined in: [types/index.ts:301](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L301)

`replace` overwrites the entire memory; `append` concatenates to existing content.

***

### type

> **type**: `"updateMemory"`

Defined in: [types/index.ts:298](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L298)
