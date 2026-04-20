[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentState

# Interface: AgentState

Defined in: [types/index.ts:368](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L368)

Runtime state maintained across loop iterations.

## Properties

### commandHistory

> **commandHistory**: [`CommandHistoryEntry`](CommandHistoryEntry.md)[]

Defined in: [types/index.ts:375](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L375)

***

### currentStep

> **currentStep**: `number`

Defined in: [types/index.ts:376](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L376)

***

### input

> **input**: `unknown`

Defined in: [types/index.ts:369](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L369)

***

### memory

> **memory**: `object`

Defined in: [types/index.ts:371](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L371)

#### longTerm

> **longTerm**: `string`

#### shortTerm

> **shortTerm**: `string`

***

### plan

> **plan**: [`PlanStep`](PlanStep.md)[]

Defined in: [types/index.ts:370](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L370)
