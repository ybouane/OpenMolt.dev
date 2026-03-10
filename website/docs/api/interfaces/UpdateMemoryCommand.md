[**openmolt**](../README.md)

***

[openmolt](../README.md) / UpdateMemoryCommand

# Interface: UpdateMemoryCommand

Defined in: [types/index.ts:297](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L297)

Command: update long-term or short-term memory.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:302](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L302)

***

### memoryType

> **memoryType**: `"longTerm"` \| `"shortTerm"`

Defined in: [types/index.ts:299](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L299)

***

### mode

> **mode**: `"replace"` \| `"append"`

Defined in: [types/index.ts:301](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L301)

`replace` overwrites the entire memory; `append` concatenates to existing content.

***

### type

> **type**: `"updateMemory"`

Defined in: [types/index.ts:298](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L298)
