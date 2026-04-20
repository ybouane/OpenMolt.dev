[**openmolt**](../README.md)

***

[openmolt](../README.md) / OAuth2Credential

# Interface: OAuth2Credential

Defined in: [types/index.ts:192](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L192)

OAuth 2.0 credential assigned to an agent.

## Properties

### config

> **config**: `object`

Defined in: [types/index.ts:194](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L194)

#### Index Signature

\[`key`: `string`\]: `unknown`

#### accessToken?

> `optional` **accessToken**: `string`

#### clientId

> **clientId**: `string`

#### clientSecret

> **clientSecret**: `string`

#### expiryDate?

> `optional` **expiryDate**: `string`

#### refreshToken

> **refreshToken**: `string`

***

### onTokenRefresh()?

> `optional` **onTokenRefresh**: (`newConfig`) => `Promise`\<`void`\>

Defined in: [types/index.ts:203](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L203)

Called after every successful token refresh so callers can persist the new tokens.

#### Parameters

##### newConfig

###### accessToken?

`string`

###### clientId

`string`

###### clientSecret

`string`

###### expiryDate?

`string`

###### refreshToken

`string`

#### Returns

`Promise`\<`void`\>

***

### type

> **type**: `"oauth2"`

Defined in: [types/index.ts:193](https://github.com/ybouane/OpenMolt.dev/blob/459db1802289429b2b18a1c184be213817ca689a/src/types/index.ts#L193)
