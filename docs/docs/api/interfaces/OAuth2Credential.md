[**openmolt**](../README.md)

***

[openmolt](../README.md) / OAuth2Credential

# Interface: OAuth2Credential

Defined in: [types/index.ts:185](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L185)

OAuth 2.0 credential assigned to an agent.

## Properties

### config

> **config**: `object`

Defined in: [types/index.ts:187](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L187)

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

Defined in: [types/index.ts:196](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L196)

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

Defined in: [types/index.ts:186](https://github.com/ybouane/OpenMolt.dev/blob/320bc822cfd5f7bca279a4aed1ef7cfe969c580b/src/types/index.ts#L186)
