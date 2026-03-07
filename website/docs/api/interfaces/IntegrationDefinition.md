[**openmolt**](../README.md)

***

[openmolt](../README.md) / IntegrationDefinition

# Interface: IntegrationDefinition

Defined in: [types/index.ts:154](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L154)

Full definition of an integration, including API setup, credential templates, scopes, and tools.

## Properties

### apiSetup?

> `optional` **apiSetup**: [`APISetup`](APISetup.md)

Defined in: [types/index.ts:158](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L158)

Default API configuration used for all HTTP tool calls.

***

### credentialSetup?

> `optional` **credentialSetup**: [`CredentialSetup`](../type-aliases/CredentialSetup.md)[]

Defined in: [types/index.ts:160](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L160)

One or more credential schemes supported by the integration.

***

### name

> **name**: `string`

Defined in: [types/index.ts:156](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L156)

Display name of the integration.

***

### scopes?

> `optional` **scopes**: `Record`\<`string`, `string`\>

Defined in: [types/index.ts:162](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L162)

Map of scope name → human-readable description.

***

### tools

> **tools**: [`ToolDefinition`](ToolDefinition.md)[]

Defined in: [types/index.ts:164](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L164)

Array of tool definitions exposed by this integration.
