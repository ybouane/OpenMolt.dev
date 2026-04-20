[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentIntegrationConfig

# Interface: AgentIntegrationConfig

Defined in: [types/index.ts:223](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L223)

Agent-level configuration for a single integration.

## Properties

### credential

> **credential**: [`AgentCredential`](../type-aliases/AgentCredential.md)

Defined in: [types/index.ts:227](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L227)

Credential information for authenticating with this integration.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:225](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L225)

Handle of the integration to use (must be registered in OpenMolt).

***

### scopes?

> `optional` **scopes**: `string`[] \| `"all"`

Defined in: [types/index.ts:229](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L229)

Scopes to restrict access to. Pass `'all'` or omit to allow every scope.
