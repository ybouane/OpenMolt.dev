[**openmolt**](../README.md)

***

[openmolt](../README.md) / DailySchedule

# Interface: DailySchedule

Defined in: [types/index.ts:428](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L428)

Run the agent on specific days/times.

## Properties

### dayOfMonth?

> `optional` **dayOfMonth**: `number`[]

Defined in: [types/index.ts:433](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L433)

Days of the month to run on (1–31).

***

### dayOfWeek?

> `optional` **dayOfWeek**: `number`[]

Defined in: [types/index.ts:431](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L431)

Days of the week to run on (0 = Sunday, 6 = Saturday).

***

### hour

> **hour**: `number`

Defined in: [types/index.ts:435](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L435)

Hour of the day (0–23).

***

### minute

> **minute**: `number`

Defined in: [types/index.ts:437](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L437)

Minute of the hour (0–59).

***

### timeZone?

> `optional` **timeZone**: `string`

Defined in: [types/index.ts:439](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L439)

IANA timezone string (defaults to system timezone).

***

### type

> **type**: `"daily"`

Defined in: [types/index.ts:429](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L429)
