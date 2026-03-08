[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentState

# Interface: AgentState

Defined in: [types/index.ts:361](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L361)

Runtime state maintained across loop iterations.

## Properties

### commandHistory

> **commandHistory**: [`CommandHistoryEntry`](CommandHistoryEntry.md)[]

Defined in: [types/index.ts:368](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L368)

***

### currentStep

> **currentStep**: `number`

Defined in: [types/index.ts:369](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L369)

***

### input

> **input**: `unknown`

Defined in: [types/index.ts:362](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L362)

***

### memory

> **memory**: `object`

Defined in: [types/index.ts:364](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L364)

#### longTerm

> **longTerm**: `string`

#### shortTerm

> **shortTerm**: `string`

***

### plan

> **plan**: [`PlanStep`](PlanStep.md)[]

Defined in: [types/index.ts:363](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L363)
