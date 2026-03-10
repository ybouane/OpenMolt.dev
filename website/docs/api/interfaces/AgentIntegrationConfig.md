[**openmolt**](../README.md)

***

[openmolt](../README.md) / AgentIntegrationConfig

# Interface: AgentIntegrationConfig

Defined in: [types/index.ts:216](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L216)

Agent-level configuration for a single integration.

## Properties

### credential

> **credential**: [`AgentCredential`](../type-aliases/AgentCredential.md)

Defined in: [types/index.ts:220](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L220)

Credential information for authenticating with this integration.

***

### integration

> **integration**: `string`

Defined in: [types/index.ts:218](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L218)

Handle of the integration to use (must be registered in OpenMolt).

***

### scopes?

> `optional` **scopes**: `string`[] \| `"all"`

Defined in: [types/index.ts:222](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L222)

Scopes to restrict access to. Pass `'all'` or omit to allow every scope.
