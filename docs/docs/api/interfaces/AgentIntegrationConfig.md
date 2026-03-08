[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentIntegrationConfig

# Interface: AgentIntegrationConfig

Defined in: [types/index.ts:216](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L216)

Agent-level configuration for a single integration.

## Properties

### credential

> **credential**: [`AgentCredential`](../type-aliases/AgentCredential.md)

Defined in: [types/index.ts:220](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L220)

Credential information for authenticating with this integration.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:218](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L218)

Handle of the integration to use (must be registered in OpenMolt).

***

### scopes?

> `optional` **scopes**: `string`[] \| `"all"`

Defined in: [types/index.ts:222](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L222)

Scopes to restrict access to. Pass `'all'` or omit to allow every scope.
