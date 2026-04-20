[**openmolt**](../README.md)

***

[openmolt](../README.md) / MemoryStore

# Interface: MemoryStore

Defined in: [types/index.ts:235](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L235)

A memory store with optional update callback.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:237](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L237)

Initial memory content (plain text or JSON string).

***

### onUpdate()?

> `optional` **onUpdate**: (`newData`) => `Promise`\<`void`\>

Defined in: [types/index.ts:239](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L239)

Called with the new content whenever memory is updated by the agent.

#### Parameters

##### newData

`string`

#### Returns

`Promise`\<`void`\>
