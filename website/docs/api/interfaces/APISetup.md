[**openmolt**](../README.md)

***

[openmolt](../README.md) / APISetup

# Interface: APISetup

Defined in: [types/index.ts:49](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L49)

Generic API setup used to configure HTTP tool calls for an integration.

## Properties

### baseUrl

> **baseUrl**: `string`

Defined in: [types/index.ts:51](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L51)

Base URL prepended to all endpoint paths. Supports Liquid templates with `config.*` variables.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `string`\>

Defined in: [types/index.ts:53](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L53)

Default headers merged into every request. Supports Liquid templates.

***

### requestFormat?

> `optional` **requestFormat**: `"json"` \| `"url-encoded"` \| `"form-data"` \| `"text"`

Defined in: [types/index.ts:61](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L61)

Body serialisation format for outgoing requests.
- `json`: `application/json` (default)
- `url-encoded`: `application/x-www-form-urlencoded` (Stripe, Twilio, etc.)
- `form-data`: multipart/form-data (file uploads)
- `text`: `text/plain`

***

### responseFormat?

> `optional` **responseFormat**: `"json"` \| `"text"` \| `"xml"`

Defined in: [types/index.ts:63](https://github.com/ybouane/OpenMolt.dev/blob/aaa1bd854d449190ce97d7f7a1084243983a3e53/src/types/index.ts#L63)

Expected format of API responses.
