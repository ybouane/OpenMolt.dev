[**openmolt**](../README.md)

***

[openmolt](../README.md) / PlanStep

# Interface: PlanStep

Defined in: [types/index.ts:349](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L349)

A single step in the agent's execution plan.

## Properties

### name

> **name**: `string`

Defined in: [types/index.ts:350](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L350)

***

### notes?

> `optional` **notes**: `string`

Defined in: [types/index.ts:352](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L352)

***

### status

> **status**: `"failed"` \| `"pending"` \| `"inProgress"` \| `"completed"`

Defined in: [types/index.ts:351](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L351)

***

### subSteps?

> `optional` **subSteps**: [`PlanSubStep`](PlanSubStep.md)[]

Defined in: [types/index.ts:354](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L354)

Sub-steps (one level deep only).
