[**openmolt**](../README.md)

***

[openmolt](../README.md) / Integration

# Class: Integration

Defined in: [Integration.ts:54](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Integration.ts#L54)

Runtime wrapper around an [IntegrationDefinition](../interfaces/IntegrationDefinition.md).
Created automatically by [OpenMolt](OpenMolt.md) when an integration is registered.

## Constructors

### Constructor

> **new Integration**(`handle`, `definition`): `Integration`

Defined in: [Integration.ts:65](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Integration.ts#L65)

#### Parameters

##### handle

`string`

Unique identifier for this integration.

##### definition

[`IntegrationDefinition`](../interfaces/IntegrationDefinition.md)

Full integration definition.

#### Returns

`Integration`

## Properties

### definition

> `readonly` **definition**: [`IntegrationDefinition`](../interfaces/IntegrationDefinition.md)

Defined in: [Integration.ts:59](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Integration.ts#L59)

The underlying integration definition supplied by the user or built-in config.

***

### handle

> `readonly` **handle**: `string`

Defined in: [Integration.ts:56](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Integration.ts#L56)

The integration's unique handle within an OpenMolt instance.

## Methods

### executeTool()

> **executeTool**(`toolHandle`, `input`, `credential`, `context`): `Promise`\<`unknown`\>

Defined in: [Integration.ts:83](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/Integration.ts#L83)

Execute a tool for the given agent credential.

The method:
1. Looks up the tool by handle.
2. Validates the tool exists.
3. Dispatches to either the custom `execute` function or the HTTP path.

#### Parameters

##### toolHandle

`string`

Handle of the tool to execute.

##### input

`Record`\<`string`, `unknown`\>

Tool input matching the tool's `inputSchema`.

##### credential

[`AgentCredential`](../type-aliases/AgentCredential.md)

Agent credential for authentication.

##### context

[`ToolContext`](../interfaces/ToolContext.md)

Execution context (agent name, etc.).

#### Returns

`Promise`\<`unknown`\>
