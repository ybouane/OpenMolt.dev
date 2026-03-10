[**openmolt**](../README.md)

***

[openmolt](../README.md) / MemoryStore

# Interface: MemoryStore

Defined in: [types/index.ts:228](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L228)

A memory store with optional update callback.

## Properties

### data

> **data**: `string`

Defined in: [types/index.ts:230](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L230)

Initial memory content (plain text or JSON string).

***

### onUpdate()?

> `optional` **onUpdate**: (`newData`) => `Promise`\<`void`\>

Defined in: [types/index.ts:232](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L232)

Called with the new content whenever memory is updated by the agent.

#### Parameters

##### newData

`string`

#### Returns

`Promise`\<`void`\>
