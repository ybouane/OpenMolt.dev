[**openmolt**](../README.md)

***

[openmolt](../README.md) / Agent

# Class: Agent

Defined in: [Agent.ts:76](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L76)

An autonomous agent that uses the Maestro reasoning loop to complete tasks.

Create via [OpenMolt.createAgent](OpenMolt.md#createagent) rather than instantiating directly.

## Example

```typescript
const agent = om.createAgent({ name: 'Writer', model: 'openai:gpt-4o', instructions: '...' });
const result = await agent.run('Write a haiku about TypeScript');
```

## Constructors

### Constructor

> **new Agent**(`config`, `omConfig`, `integrations`): `Agent`

Defined in: [Agent.ts:97](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L97)

#### Parameters

##### config

[`AgentConfig`](../interfaces/AgentConfig.md)

Agent configuration.

##### omConfig

[`OpenMoltConfig`](../interfaces/OpenMoltConfig.md)

Parent OpenMolt configuration.

##### integrations

`Map`\<`string`, [`Integration`](Integration.md)\>

All integrations registered in the OpenMolt instance.

#### Returns

`Agent`

## Properties

### name

> `readonly` **name**: `string`

Defined in: [Agent.ts:78](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L78)

The agent's display name.

## Methods

### cancelSchedule()

> **cancelSchedule**(`scheduleId`): `boolean`

Defined in: [Agent.ts:282](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L282)

Cancel a previously registered schedule.

#### Parameters

##### scheduleId

`string`

ID returned by [schedule](#schedule).

#### Returns

`boolean`

***

### off()

> **off**\<`K`\>(`event`, `handler`): `this`

Defined in: [Agent.ts:248](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L248)

Remove an event listener.

#### Type Parameters

##### K

`K` *extends* keyof [`AgentEventMap`](../type-aliases/AgentEventMap.md)

#### Parameters

##### event

`K`

Event name.

##### handler

(`e`) => `void`

The exact handler reference to remove.

#### Returns

`this`

***

### on()

> **on**\<`K`\>(`event`, `handler`): `this`

Defined in: [Agent.ts:234](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L234)

Register an event listener.

#### Type Parameters

##### K

`K` *extends* keyof [`AgentEventMap`](../type-aliases/AgentEventMap.md)

#### Parameters

##### event

`K`

Event name.

##### handler

(`e`) => `void`

Handler function.

#### Returns

`this`

***

### run()

> **run**(`input`): `Promise`\<`unknown`\>

Defined in: [Agent.ts:144](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L144)

Run the agent with the provided input.

The agent will iterate the Maestro loop until it issues a `finish` command
or the maximum number of steps is reached.

#### Parameters

##### input

`unknown`

Initial input to the agent (string, object, or any serialisable value).

#### Returns

`Promise`\<`unknown`\>

The output from the agent's `finish` command.

***

### schedule()

> **schedule**(`config`): `string`

Defined in: [Agent.ts:263](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/Agent.ts#L263)

Schedule the agent to run automatically.

#### Parameters

##### config

[`ScheduleConfig`](../type-aliases/ScheduleConfig.md)

Schedule configuration (interval or daily).

#### Returns

`string`

A schedule ID that can be passed to [cancelSchedule](#cancelschedule).
