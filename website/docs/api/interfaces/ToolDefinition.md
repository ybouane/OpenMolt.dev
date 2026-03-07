[**openmolt**](../README.md)

***

[openmolt](../README.md) / ToolDefinition

# Interface: ToolDefinition

Defined in: [types/index.ts:123](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L123)

Definition of a single tool within an integration.

## Properties

### body?

> `optional` **body**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:141](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L141)

Request body. Supports Liquid templates.

***

### description

> **description**: `string`

Defined in: [types/index.ts:127](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L127)

Human-readable description of what the tool does.

***

### endpoint?

> `optional` **endpoint**: `string`

Defined in: [types/index.ts:135](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L135)

Path appended to the integration's `baseUrl`. Supports Liquid templates with `input.*`.

***

### execute()?

> `optional` **execute**: (`input`, `context`) => `Promise`\<`unknown`\>

Defined in: [types/index.ts:145](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L145)

Custom async function invoked when the tool is called. Takes precedence over HTTP config.

#### Parameters

##### input

`Record`\<`string`, `unknown`\>

##### context

[`ToolContext`](ToolContext.md)

#### Returns

`Promise`\<`unknown`\>

***

### handle

> **handle**: `string`

Defined in: [types/index.ts:125](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L125)

Unique handle used to identify the tool within its integration.

***

### headers?

> `optional` **headers**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:139](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L139)

Additional headers to merge for this specific tool.

***

### inputSchema?

> `optional` **inputSchema**: `ZodTypeAny`

Defined in: [types/index.ts:148](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L148)

Zod schema describing the expected input object.

***

### method?

> `optional` **method**: `string`

Defined in: [types/index.ts:133](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L133)

HTTP method.

***

### outputSchema?

> `optional` **outputSchema**: `ZodTypeAny`

Defined in: [types/index.ts:150](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L150)

Zod schema describing the expected output object (informational for the agent).

***

### queryParams?

> `optional` **queryParams**: `Record`\<`string`, `unknown`\>

Defined in: [types/index.ts:137](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L137)

Query parameters. Supports Liquid templates.

***

### scopes?

> `optional` **scopes**: `string`[]

Defined in: [types/index.ts:129](https://github.com/ybouane/OpenMolt.dev/blob/f23f5706110c4344c0446c6b92aa882c6da8f07f/src/types/index.ts#L129)

Scopes from the integration's `scopes` map that are required to use this tool.
