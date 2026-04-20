[**openmolt**](../README.md)

***

[openmolt](../README.md) / UpdateMemoryCommand

# Interface: UpdateMemoryCommand

Defined in: [types/index.ts:304](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L304)

Command: update long-term or short-term memory.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:309](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L309)

***

### memoryType

> **memoryType**: `"longTerm"` \| `"shortTerm"`

Defined in: [types/index.ts:306](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L306)

***

### mode

> **mode**: `"replace"` \| `"append"`

Defined in: [types/index.ts:308](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L308)

`replace` overwrites the entire memory; `append` concatenates to existing content.

***

### type

> **type**: `"updateMemory"`

Defined in: [types/index.ts:305](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L305)
