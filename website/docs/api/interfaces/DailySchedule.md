[**openmolt**](../README.md)

***

[openmolt](../README.md) / DailySchedule

# Interface: DailySchedule

Defined in: [types/index.ts:421](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L421)

Run the agent on specific days/times.

## Properties

### dayOfMonth?

> `optional` **dayOfMonth**: `number`[]

Defined in: [types/index.ts:426](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L426)

Days of the month to run on (1–31).

***

### dayOfWeek?

> `optional` **dayOfWeek**: `number`[]

Defined in: [types/index.ts:424](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L424)

Days of the week to run on (0 = Sunday, 6 = Saturday).

***

### hour

> **hour**: `number`

Defined in: [types/index.ts:428](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L428)

Hour of the day (0–23).

***

### minute

> **minute**: `number`

Defined in: [types/index.ts:430](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L430)

Minute of the hour (0–59).

***

### timeZone?

> `optional` **timeZone**: `string`

Defined in: [types/index.ts:432](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L432)

IANA timezone string (defaults to system timezone).

***

### type

> **type**: `"daily"`

Defined in: [types/index.ts:422](https://github.com/ybouane/OpenMolt.dev/blob/f83b080d3401ed5b44b6d49e1e6dcc87d61eedd5/src/types/index.ts#L422)
