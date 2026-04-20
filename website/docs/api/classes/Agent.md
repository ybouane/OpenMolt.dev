[**openmolt**](../README.md)

***

[openmolt](../README.md) / Agent

# Class: Agent

Defined in: [Agent.ts:106](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L106)

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

Defined in: [Agent.ts:127](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L127)

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

Defined in: [Agent.ts:108](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L108)

The agent's display name.

## Methods

### cancelSchedule()

> **cancelSchedule**(`scheduleId`): `boolean`

Defined in: [Agent.ts:332](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L332)

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

Defined in: [Agent.ts:298](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L298)

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

Defined in: [Agent.ts:284](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L284)

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

Defined in: [Agent.ts:174](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L174)

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

Defined in: [Agent.ts:313](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Agent.ts#L313)

Schedule the agent to run automatically.

#### Parameters

##### config

[`ScheduleConfig`](../type-aliases/ScheduleConfig.md)

Schedule configuration (interval or daily).

#### Returns

`string`

A schedule ID that can be passed to [cancelSchedule](#cancelschedule).
