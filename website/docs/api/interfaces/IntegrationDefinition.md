[**openmolt**](../README.md)

***

[openmolt](../README.md) / IntegrationDefinition

# Interface: IntegrationDefinition

Defined in: [types/index.ts:154](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L154)

Full definition of an integration, including API setup, credential templates, scopes, and tools.

## Properties

### apiSetup?

> `optional` **apiSetup**: [`APISetup`](APISetup.md)

Defined in: [types/index.ts:165](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L165)

Default API configuration used for all HTTP tool calls.

***

### credentialSetup?

> `optional` **credentialSetup**: [`CredentialSetup`](../type-aliases/CredentialSetup.md)[]

Defined in: [types/index.ts:167](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L167)

One or more credential schemes supported by the integration.

***

### instructions?

> `optional` **instructions**: `string`

Defined in: [types/index.ts:163](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L163)

Markdown-formatted guidance injected into the agent prompt to help it use the
integration's tools effectively. Should clarify non-obvious input formats,
common workflows, id/handle conventions, and pitfalls that the input/output
schemas alone do not convey.

***

### name

> **name**: `string`

Defined in: [types/index.ts:156](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L156)

Display name of the integration.

***

### scopes?

> `optional` **scopes**: `Record`\<`string`, `string`\>

Defined in: [types/index.ts:169](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L169)

Map of scope name → human-readable description.

***

### tools

> **tools**: [`ToolDefinition`](ToolDefinition.md)[]

Defined in: [types/index.ts:171](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L171)

Array of tool definitions exposed by this integration.
