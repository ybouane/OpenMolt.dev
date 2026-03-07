[**openmolt**](../README.md)

***

[openmolt](../README.md) / OpenMolt

# Class: OpenMolt

Defined in: [OpenMolt.ts:92](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L92)

The main OpenMolt class.

Manages LLM provider configuration, integration registration, and agent creation.

## Constructors

### Constructor

> **new OpenMolt**(`config?`): `OpenMolt`

Defined in: [OpenMolt.ts:102](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L102)

Create a new OpenMolt instance.

#### Parameters

##### config?

[`OpenMoltConfig`](../interfaces/OpenMoltConfig.md) = `{}`

Global configuration including LLM provider API keys,
                integration configs, max steps, and verbosity.

#### Returns

`OpenMolt`

## Methods

### createAgent()

> **createAgent**(`config`): [`Agent`](Agent.md)

Defined in: [OpenMolt.ts:138](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L138)

Create a new [Agent](Agent.md) instance.

#### Parameters

##### config

[`AgentConfig`](../interfaces/AgentConfig.md)

Agent configuration.

#### Returns

[`Agent`](Agent.md)

A fully configured, ready-to-run agent.

***

### getIntegration()

> **getIntegration**(`handle`): [`Integration`](Integration.md) \| `undefined`

Defined in: [OpenMolt.ts:147](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L147)

Retrieve a registered integration by handle.

#### Parameters

##### handle

`string`

Integration handle.

#### Returns

[`Integration`](Integration.md) \| `undefined`

***

### listIntegrations()

> **listIntegrations**(): `string`[]

Defined in: [OpenMolt.ts:154](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L154)

Returns an array of all registered integration handles.

#### Returns

`string`[]

***

### registerIntegration()

> **registerIntegration**(`handle`, `definition`): `this`

Defined in: [OpenMolt.ts:127](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L127)

Register a custom integration (or override an existing one).

The integration will be available to any agent created after this call
that includes the handle in its `integrations` list.

#### Parameters

##### handle

`string`

Unique identifier for the integration.

##### definition

[`IntegrationDefinition`](../interfaces/IntegrationDefinition.md)

Integration definition (tools, API setup, scopes, etc.).

#### Returns

`this`

#### Example

```typescript
om.registerIntegration('myApi', {
  name: 'My API',
  apiSetup: { baseUrl: 'https://api.example.com' },
  tools: [ ... ],
});
```

***

### FileSystemIntegration()

> `static` **FileSystemIntegration**(`directories`): [`IntegrationDefinition`](../interfaces/IntegrationDefinition.md)

Defined in: [OpenMolt.ts:171](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/OpenMolt.ts#L171)

Create a FileSystem integration definition restricted to the given
directories.

Register the result via [registerIntegration](#registerintegration):
```typescript
om.registerIntegration('fileSystem', OpenMolt.FileSystemIntegration('/data'));
```

#### Parameters

##### directories

Allowed base directory or array of directories.

`string` | `string`[]

#### Returns

[`IntegrationDefinition`](../interfaces/IntegrationDefinition.md)
