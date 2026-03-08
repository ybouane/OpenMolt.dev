[**openmolt**](../README.md)

***

[openmolt](../README.md) / PlanStep

# Interface: PlanStep

Defined in: [types/index.ts:342](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L342)

A single step in the agent's execution plan.

## Properties

### name

> **name**: `string`

Defined in: [types/index.ts:343](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L343)

***

### notes?

> `optional` **notes**: `string`

Defined in: [types/index.ts:345](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L345)

***

### status

> **status**: `"failed"` \| `"pending"` \| `"inProgress"` \| `"completed"`

Defined in: [types/index.ts:344](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L344)

***

### subSteps?

> `optional` **subSteps**: [`PlanSubStep`](PlanSubStep.md)[]

Defined in: [types/index.ts:347](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L347)

Sub-steps (one level deep only).
