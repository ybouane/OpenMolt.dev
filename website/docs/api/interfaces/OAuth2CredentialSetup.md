[**openmolt**](../README.md)

***

[openmolt](../README.md) / OAuth2CredentialSetup

# Interface: OAuth2CredentialSetup

Defined in: [types/index.ts:81](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L81)

OAuth 2.0 credential setup.

## Properties

### authUrl

> **authUrl**: `string`

Defined in: [types/index.ts:84](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L84)

URL to obtain an authorisation code.

***

### clientId

> **clientId**: `string`

Defined in: [types/index.ts:88](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L88)

Client identifier template (`{{ config.clientId }}`).

***

### clientSecret

> **clientSecret**: `string`

Defined in: [types/index.ts:90](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L90)

Client secret template.

***

### refreshToken

> **refreshToken**: `string`

Defined in: [types/index.ts:92](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L92)

Refresh token template.

***

### scopes?

> `optional` **scopes**: `string`[]

Defined in: [types/index.ts:94](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L94)

Scopes required for the token.

***

### tokenUrl

> **tokenUrl**: `string`

Defined in: [types/index.ts:86](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L86)

URL used to exchange a refresh token for an access token.

***

### type

> **type**: `"oauth2"`

Defined in: [types/index.ts:82](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L82)
