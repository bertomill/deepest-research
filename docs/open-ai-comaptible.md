# OpenAI-Compatible API

Copy page

Ask AI about this page

Last updated August 16, 2025

AI Gateway provides OpenAI-compatible API endpoints, letting you use multiple AI providers through a familiar interface. You can use existing OpenAI client libraries, switch to the AI Gateway with a URL change, and keep your current tools and workflows without code rewrites.

The OpenAI-compatible API implements the same specification as the [OpenAI API](https://platform.openai.com/docs/api-reference/chat).

## [Base URL](#base-url)

The OpenAI-compatible API is available at the following base URL:

`https://ai-gateway.vercel.sh/v1`

## [Authentication](#authentication)

The OpenAI-compatible API supports the same authentication methods as the main AI Gateway:

*   API key: Use your AI Gateway API key with the `Authorization: Bearer <token>` header
*   OIDC token: Use your Vercel OIDC token with the `Authorization: Bearer <token>` header

You only need to use one of these forms of authentication. If an API key is specified it will take precedence over any OIDC token, even if the API key is invalid.

## [Supported endpoints](#supported-endpoints)

The AI Gateway supports the following OpenAI-compatible endpoints:

*   [`GET /models`](#list-models) - List available models
*   [`GET /models/{model}`](#retrieve-model) - Retrieve a specific model
*   [`POST /chat/completions`](#chat-completions) - Create chat completions with support for streaming, attachments, tool calls, and image generation
*   [`POST /embeddings`](#embeddings) - Generate vector embeddings

## [Integration with existing tools](#integration-with-existing-tools)

You can use the AI Gateway's OpenAI-compatible API with existing tools and libraries like the [OpenAI client libraries](https://platform.openai.com/docs/libraries) and [AI SDK 4](https://v4.ai-sdk.dev/). Point your existing client to the AI Gateway's base URL and use your AI Gateway [API key](/docs/ai-gateway/authentication#api-key) or [OIDC token](/docs/ai-gateway/authentication#oidc-token) for authentication.

### [OpenAI client libraries](#openai-client-libraries)

TypeScriptPython

client.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [{ role: 'user', content: 'Hello, world!' }],
});
```

client.py

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
response = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {'role': 'user', 'content': 'Hello, world!'}
    ]
)
```

### [AI SDK 4](#ai-sdk-4)

For compatibility with [AI SDK v4](https://v4.ai-sdk.dev/) and AI Gateway, install the [@ai-sdk/openai-compatible](https://ai-sdk.dev/providers/openai-compatible-providers) package.

Verify that you are using AI SDK 4 by using the following package versions: `@ai-sdk/openai-compatible` version `<1.0.0` (e.g., `0.2.16`) and `ai` version `<5.0.0` (e.g., `4.3.19`).

TypeScript

client.ts

```
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { generateText } from 'ai';
 
const gateway = createOpenAICompatible({
  name: 'openai',
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await generateText({
  model: gateway('anthropic/claude-sonnet-4'),
  prompt: 'Hello, world!',
});
```

## [List models](#list-models)

Retrieve a list of all available models that can be used with the AI Gateway.

Endpoint

`GET /models`

Example request

TypeScriptPython

list-models.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const models = await openai.models.list();
console.log(models);
```

list-models.py

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
models = client.models.list()
print(models)
```

Response format

The response follows the OpenAI API format:

```
{
  "object": "list",
  "data": [
    {
      "id": "anthropic/claude-sonnet-4",
      "object": "model",
      "created": 1677610602,
      "owned_by": "anthropic"
    },
    {
      "id": "openai/gpt-4.1-mini",
      "object": "model",
      "created": 1677610602,
      "owned_by": "openai"
    }
  ]
}
```

## [Retrieve model](#retrieve-model)

Retrieve details about a specific model.

Endpoint

`GET /models/{model}`

Parameters

*   `model` (required): The model ID to retrieve (e.g., `anthropic/claude-sonnet-4`)

Example request

TypeScriptPython

retrieve-model.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const model = await openai.models.retrieve('anthropic/claude-sonnet-4');
console.log(model);
```

retrieve-model.py

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
model = client.models.retrieve('anthropic/claude-sonnet-4')
print(model)
```

Response format

```
{
  "id": "anthropic/claude-sonnet-4",
  "object": "model",
  "created": 1677610602,
  "owned_by": "anthropic"
}
```

## [Chat completions](#chat-completions)

Create chat completions using various AI models available through the AI Gateway.

Endpoint

`POST /chat/completions`

### [Basic chat completion](#basic-chat-completion)

Create a non-streaming chat completion.

Example request

TypeScriptPython

chat-completion.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

chat-completion.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Response format

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Once upon a time, a gentle unicorn with a shimmering silver mane danced through moonlit clouds, sprinkling stardust dreams upon sleeping children below."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Streaming chat completion](#streaming-chat-completion)

Create a streaming chat completion that streams tokens as they are generated.

Example request

TypeScriptPython

streaming-chat.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'Write a one-sentence bedtime story about a unicorn.',
    },
  ],
  stream: true,
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

streaming-chat.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Write a one-sentence bedtime story about a unicorn.'
        }
    ],
    stream=True,
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

#### [Streaming response format](#streaming-response-format)

Streaming responses are sent as [Server-Sent Events (SSE)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), a web standard for real-time data streaming over HTTP. Each event contains a JSON object with the partial response data.

The response format follows the OpenAI streaming specification:

```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":"Once"},"finish_reason":null}]}
 
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"anthropic/claude-sonnet-4","choices":[{"index":0,"delta":{"content":" upon"},"finish_reason":null}]}
 
data: [DONE]
```

Key characteristics:

*   Each line starts with `data:` followed by JSON
*   Content is delivered incrementally in the `delta.content` field
*   The stream ends with `data: [DONE]`
*   Empty lines separate events

SSE Parsing Libraries:

If you're building custom SSE parsing (instead of using the OpenAI SDK), these libraries can help:

*   JavaScript/TypeScript: [`eventsource-parser`](https://www.npmjs.com/package/eventsource-parser) - Robust SSE parsing with support for partial events
*   Python: [`httpx-sse`](https://pypi.org/project/httpx-sse/) - SSE support for HTTPX, or [`sseclient-py`](https://pypi.org/project/sseclient-py/) for requests

For more details about the SSE specification, see the [W3C specification](https://html.spec.whatwg.org/multipage/server-sent-events.html).

### [Image attachments](#image-attachments)

Send images as part of your chat completion request.

Example request

TypeScriptPython

image-analysis.ts

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this image in detail.' },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/png;base64,${imageBase64}`,
            detail: 'auto',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

image-analysis.py

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the image file as base64
with open('./path/to/image.png', 'rb') as image_file:
    image_base64 = base64.b64encode(image_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {'type': 'text', 'text': 'Describe this image in detail.'},
                {
                    'type': 'image_url',
                    'image_url': {
                        'url': f'data:image/png;base64,{image_base64}',
                        'detail': 'auto'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [PDF attachments](#pdf-attachments)

Send PDF documents as part of your chat completion request.

Example request

TypeScriptPython

pdf-analysis.ts

```
import fs from 'node:fs';
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// Read the PDF file as base64
const pdfBuffer = fs.readFileSync('./path/to/document.pdf');
const pdfBase64 = pdfBuffer.toString('base64');
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'What is the main topic of this document? Please summarize the key points.',
        },
        {
          type: 'file',
          file: {
            data: pdfBase64,
            media_type: 'application/pdf',
            filename: 'document.pdf',
          },
        },
      ],
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

pdf-analysis.py

```
import os
import base64
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
# Read the PDF file as base64
with open('./path/to/document.pdf', 'rb') as pdf_file:
    pdf_base64 = base64.b64encode(pdf_file.read()).decode('utf-8')
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': [
                {
                    'type': 'text',
                    'text': 'What is the main topic of this document? Please summarize the key points.'
                },
                {
                    'type': 'file',
                    'file': {
                        'data': pdf_base64,
                        'media_type': 'application/pdf',
                        'filename': 'document.pdf'
                    }
                }
            ]
        }
    ],
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

### [Tool calls](#tool-calls)

The AI Gateway supports OpenAI-compatible function calling, allowing models to call tools and functions. This follows the same specification as the [OpenAI Function Calling API](https://platform.openai.com/docs/guides/function-calling).

#### [Basic tool calls](#basic-tool-calls)

TypeScriptPython

tool-calls.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The city and state, e.g. San Francisco, CA',
          },
          unit: {
            type: 'string',
            enum: ['celsius', 'fahrenheit'],
            description: 'The unit for temperature',
          },
        },
        required: ['location'],
      },
    },
  },
];
 
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'What is the weather like in San Francisco?',
    },
  ],
  tools: tools,
  tool_choice: 'auto',
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tool calls:', completion.choices[0].message.tool_calls);
```

tool-calls.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
tools = [
    {
        'type': 'function',
        'function': {
            'name': 'get_weather',
            'description': 'Get the current weather in a given location',
            'parameters': {
                'type': 'object',
                'properties': {
                    'location': {
                        'type': 'string',
                        'description': 'The city and state, e.g. San Francisco, CA'
                    },
                    'unit': {
                        'type': 'string',
                        'enum': ['celsius', 'fahrenheit'],
                        'description': 'The unit for temperature'
                    }
                },
                'required': ['location']
            }
        }
    }
]
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'What is the weather like in San Francisco?'
        }
    ],
    tools=tools,
    tool_choice='auto',
    stream=False,
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tool calls:', completion.choices[0].message.tool_calls)
```

Controlling tool selection: By default, `tool_choice` is set to `'auto'`, allowing the model to decide when to use tools. You can also:

*   Set to `'none'` to disable tool calls
*   Force a specific tool with: `tool_choice: { type: 'function', function: { name: 'your_function_name' } }`

#### [Tool call response format](#tool-call-response-format)

When the model makes tool calls, the response includes tool call information:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_123",
            "type": "function",
            "function": {
              "name": "get_weather",
              "arguments": "{\"location\": \"San Francisco, CA\", \"unit\": \"celsius\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ],
  "usage": {
    "prompt_tokens": 82,
    "completion_tokens": 18,
    "total_tokens": 100
  }
}
```

### [Structured outputs](#structured-outputs)

Generate structured JSON responses that conform to a specific schema, ensuring predictable and reliable data formats for your applications.

#### [JSON Schema format](#json-schema-format)

Use the OpenAI standard `json_schema` response format for the most robust structured output experience. This follows the official [OpenAI Structured Outputs specification](https://platform.openai.com/docs/guides/structured-outputs).

Example request

TypeScriptPython

structured-output-json-schema.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'openai/gpt-5',
  messages: [
    {
      role: 'user',
      content: 'Create a product listing for a wireless gaming headset.',
    },
  ],
  stream: false,
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'product_listing',
      description: 'A product listing with details and pricing',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Product name',
          },
          brand: {
            type: 'string',
            description: 'Brand name',
          },
          price: {
            type: 'number',
            description: 'Price in USD',
          },
          category: {
            type: 'string',
            description: 'Product category',
          },
          description: {
            type: 'string',
            description: 'Product description',
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key product features',
          },
        },
        required: ['name', 'brand', 'price', 'category', 'description'],
        additionalProperties: false,
      },
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
 
// Parse the structured response
const structuredData = JSON.parse(completion.choices[0].message.content);
console.log('Structured Data:', structuredData);
```

structured-output-json-schema.py

```
import os
import json
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='openai/gpt-5',
    messages=[
        {
            'role': 'user',
            'content': 'Create a product listing for a wireless gaming headset.'
        }
    ],
    stream=False,
    response_format={
        'type': 'json_schema',
        'json_schema': {
            'name': 'product_listing',
            'description': 'A product listing with details and pricing',
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {
                        'type': 'string',
                        'description': 'Product name'
                    },
                    'brand': {
                        'type': 'string',
                        'description': 'Brand name'
                    },
                    'price': {
                        'type': 'number',
                        'description': 'Price in USD'
                    },
                    'category': {
                        'type': 'string',
                        'description': 'Product category'
                    },
                    'description': {
                        'type': 'string',
                        'description': 'Product description'
                    },
                    'features': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'description': 'Key product features'
                    }
                },
                'required': ['name', 'brand', 'price', 'category', 'description'],
                'additionalProperties': False
            },
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
 
# Parse the structured response
structured_data = json.loads(completion.choices[0].message.content)
print('Structured Data:', json.dumps(structured_data, indent=2))
```

Response format

The response contains structured JSON that conforms to your specified schema:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "openai/gpt-5",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "{\"name\":\"SteelSeries Arctis 7P\",\"brand\":\"SteelSeries\",\"price\":149.99,\"category\":\"Gaming Headsets\",\"description\":\"Wireless gaming headset with 7.1 surround sound\",\"features\":[\"Wireless 2.4GHz\",\"7.1 Surround Sound\",\"24-hour battery\",\"Retractable microphone\"]}"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 45,
    "total_tokens": 70
  }
}
```

#### [JSON Schema parameters](#json-schema-parameters)

*   `type`: Must be `"json_schema"`
*   `json_schema`: Object containing schema definition
    *   `name` (required): Name of the response schema
    *   `description` (optional): Human-readable description of the expected output
    *   `schema` (required): Valid JSON Schema object defining the structure

#### [Legacy JSON format (alternative)](#legacy-json-format-alternative)

Legacy format: The following format is supported for backward compatibility. For new implementations, use the `json_schema` format above.

TypeScriptPython

structured-output-legacy.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'openai/gpt-5',
  messages: [
    {
      role: 'user',
      content: 'Create a product listing for a wireless gaming headset.',
    },
  ],
  stream: false,
  // @ts-expect-error - Legacy format not in OpenAI types
  response_format: {
    type: 'json',
    name: 'product_listing',
    description: 'A product listing with details and pricing',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name' },
        brand: { type: 'string', description: 'Brand name' },
        price: { type: 'number', description: 'Price in USD' },
        category: { type: 'string', description: 'Product category' },
        description: { type: 'string', description: 'Product description' },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key product features',
        },
      },
      required: ['name', 'brand', 'price', 'category', 'description'],
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
```

structured-output-legacy.py

```
import os
import json
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='openai/gpt-5',
    messages=[
        {
            'role': 'user',
            'content': 'Create a product listing for a wireless gaming headset.'
        }
    ],
    stream=False,
    response_format={
        'type': 'json',
        'name': 'product_listing',
        'description': 'A product listing with details and pricing',
        'schema': {
            'type': 'object',
            'properties': {
                'name': {'type': 'string', 'description': 'Product name'},
                'brand': {'type': 'string', 'description': 'Brand name'},
                'price': {'type': 'number', 'description': 'Price in USD'},
                'category': {'type': 'string', 'description': 'Product category'},
                'description': {'type': 'string', 'description': 'Product description'},
                'features': {
                    'type': 'array',
                    'items': {'type': 'string'},
                    'description': 'Key product features'
                }
            },
            'required': ['name', 'brand', 'price', 'category', 'description']
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
 
# Parse the structured response
structured_data = json.loads(completion.choices[0].message.content)
print('Structured Data:', json.dumps(structured_data, indent=2))
```

#### [Streaming with structured outputs](#streaming-with-structured-outputs)

Both `json_schema` and legacy `json` formats work with streaming responses:

TypeScriptPython

structured-streaming.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'openai/gpt-5',
  messages: [
    {
      role: 'user',
      content: 'Create a product listing for a wireless gaming headset.',
    },
  ],
  stream: true,
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'product_listing',
      description: 'A product listing with details and pricing',
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Product name' },
          brand: { type: 'string', description: 'Brand name' },
          price: { type: 'number', description: 'Price in USD' },
          category: { type: 'string', description: 'Product category' },
          description: { type: 'string', description: 'Product description' },
          features: {
            type: 'array',
            items: { type: 'string' },
            description: 'Key product features',
          },
        },
        required: ['name', 'brand', 'price', 'category', 'description'],
        additionalProperties: false,
      },
    },
  },
});
 
let completeResponse = '';
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
    completeResponse += content;
  }
}
 
// Parse the complete structured response
const structuredData = JSON.parse(completeResponse);
console.log('\nParsed Product:', structuredData);
```

structured-streaming.py

```
import os
import json
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='openai/gpt-5',
    messages=[
        {
            'role': 'user',
            'content': 'Create a product listing for a wireless gaming headset.'
        }
    ],
    stream=True,
    response_format={
        'type': 'json_schema',
        'json_schema': {
            'name': 'product_listing',
            'description': 'A product listing with details and pricing',
            'schema': {
                'type': 'object',
                'properties': {
                    'name': {'type': 'string', 'description': 'Product name'},
                    'brand': {'type': 'string', 'description': 'Brand name'},
                    'price': {'type': 'number', 'description': 'Price in USD'},
                    'category': {'type': 'string', 'description': 'Product category'},
                    'description': {'type': 'string', 'description': 'Product description'},
                    'features': {
                        'type': 'array',
                        'items': {'type': 'string'},
                        'description': 'Key product features'
                    }
                },
                'required': ['name', 'brand', 'price', 'category', 'description'],
                'additionalProperties': False
            },
        }
    }
)
 
complete_response = ''
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta.content:
        content = chunk.choices[0].delta.content
        print(content, end='', flush=True)
        complete_response += content
 
# Parse the complete structured response
structured_data = json.loads(complete_response)
print('\nParsed Product:', json.dumps(structured_data, indent=2))
```

Streaming assembly: When using structured outputs with streaming, you'll need to collect all the content chunks and parse the complete JSON response once the stream is finished.

### [Reasoning configuration](#reasoning-configuration)

Configure reasoning behavior for models that support extended thinking or chain-of-thought reasoning. The `reasoning` parameter allows you to control how reasoning tokens are generated and returned.

Example request

TypeScript (OpenAI SDK)TypeScript (fetch)Python

reasoning-openai-sdk.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error - reasoning parameter not yet in OpenAI types
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'What is the meaning of life? Think before answering.',
    },
  ],
  stream: false,
  reasoning: {
    max_tokens: 2000, // Limit reasoning tokens
    enabled: true, // Enable reasoning
  },
});
 
console.log('Reasoning:', completion.choices[0].message.reasoning);
console.log('Answer:', completion.choices[0].message.content);
console.log(
  'Reasoning tokens:',
  completion.usage.completion_tokens_details?.reasoning_tokens,
);
```

reasoning-fetch.ts

```
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life? Think before answering.',
        },
      ],
      stream: false,
      reasoning: {
        max_tokens: 2000,
        enabled: true,
      },
    }),
  },
);
 
const completion = await response.json();
console.log('Reasoning:', completion.choices[0].message.reasoning);
console.log('Answer:', completion.choices[0].message.content);
```

reasoning.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'What is the meaning of life? Think before answering.'
        }
    ],
    stream=False,
    extra_body={
        'reasoning': {
            'max_tokens': 2000,
            'enabled': True
        }
    }
)
 
print('Reasoning:', completion.choices[0].message.reasoning)
print('Answer:', completion.choices[0].message.content)
print('Reasoning tokens:', completion.usage.completion_tokens_details.reasoning_tokens)
```

#### [Reasoning parameters](#reasoning-parameters)

The `reasoning` object supports the following parameters:

*   `enabled` (boolean, optional): Enable reasoning output. When `true`, the model will provide its reasoning process.
*   `max_tokens` (number, optional): Maximum number of tokens to allocate for reasoning. This helps control costs and response times. Cannot be used with `effort`.
*   `effort` (string, optional): Control reasoning effort level. Accepts `'low'`, `'medium'`, or `'high'`. Cannot be used with `max_tokens`.
*   `exclude` (boolean, optional): When `true`, excludes reasoning content from the response but still generates it internally. Useful for reducing response payload size.

Mutually exclusive parameters: You cannot specify both `effort` and `max_tokens` in the same request. Choose one based on your use case.

#### [Response format with reasoning](#response-format-with-reasoning)

When reasoning is enabled, the response includes reasoning content:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The meaning of life is a deeply personal question...",
        "reasoning": "Let me think about this carefully. The question asks about..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 150,
    "total_tokens": 165,
    "completion_tokens_details": {
      "reasoning_tokens": 50
    }
  }
}
```

#### [Streaming with reasoning](#streaming-with-reasoning)

Reasoning content is streamed incrementally in the `delta.reasoning` field:

TypeScriptPython

reasoning-streaming.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error - reasoning parameter not yet in OpenAI types
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content: 'What is the meaning of life? Think before answering.',
    },
  ],
  stream: true,
  reasoning: {
    enabled: true,
  },
});
 
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;
 
  // Handle reasoning content
  if (delta?.reasoning) {
    process.stdout.write(`[Reasoning] ${delta.reasoning}`);
  }
 
  // Handle regular content
  if (delta?.content) {
    process.stdout.write(delta.content);
  }
}
```

reasoning-streaming.py

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'What is the meaning of life? Think before answering.'
        }
    ],
    stream=True,
    extra_body={
        'reasoning': {
            'enabled': True
        }
    }
)
 
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta:
        delta = chunk.choices[0].delta
 
        # Handle reasoning content
        if hasattr(delta, 'reasoning') and delta.reasoning:
            print(f"[Reasoning] {delta.reasoning}", end='', flush=True)
 
        # Handle regular content
        if hasattr(delta, 'content') and delta.content:
            print(delta.content, end='', flush=True)
```

#### [Preserving reasoning details across providers](#preserving-reasoning-details-across-providers)

The AI Gateway preserves reasoning details from models across interactions, normalizing the different formats used by OpenAI, Anthropic, and other providers into a consistent structure. This allows you to switch between models without rewriting your conversation management logic.

This is particularly useful during tool calling workflows where the model needs to resume its thought process after receiving tool results.

Controlling reasoning details

When `reasoning.enabled` is `true` (or when `reasoning.exclude` is not set), responses include a `reasoning_details` array alongside the standard `reasoning` text field. This structured field captures cryptographic signatures, encrypted content, and other verification data that providers include with their reasoning output.

Each detail object contains:

*   `type`: one or more of the below, depending on the provider and model
    *   `'reasoning.text'`: Contains the actual reasoning content as plain text in the `text` field. May include a `signature` field (Anthropic models) for cryptographic verification.
    *   `'reasoning.encrypted'`: Contains encrypted or redacted reasoning content in the `data` field. Used by OpenAI models when reasoning is protected, or by Anthropic models when thinking is redacted. Preserves the encrypted payload for verification purposes.
    *   `'reasoning.summary'`: Contains a condensed version of the reasoning process in the `summary` field. Used by OpenAI models to provide a readable summary alongside encrypted reasoning.
*   `id` (optional): Unique identifier for the reasoning block, used for tracking and correlation
*   `format`: Provider format identifier - `'openai-responses-v1'`, `'anthropic-claude-v1'`, or `'unknown'`
*   `index` (optional): Position in the reasoning sequence (for responses with multiple reasoning blocks)

Example response with reasoning details

For Anthropic models:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The meaning of life is a deeply personal question...",
        "reasoning": "Let me think about this carefully. The question asks about...",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "Let me think about this carefully. The question asks about...",
            "signature": "anthropic-signature-xyz",
            "format": "anthropic-claude-v1",
            "index": 0
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 150,
    "total_tokens": 165,
    "completion_tokens_details": {
      "reasoning_tokens": 50
    }
  }
}
```

For OpenAI models (returns both summary and encrypted):

```
{
  "id": "chatcmpl-456",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "openai/o3-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The answer is 42.",
        "reasoning": "Let me calculate this step by step...",
        "reasoning_details": [
          {
            "type": "reasoning.summary",
            "summary": "Let me calculate this step by step...",
            "format": "openai-responses-v1",
            "index": 0
          },
          {
            "type": "reasoning.encrypted",
            "data": "encrypted_reasoning_content_xyz",
            "format": "openai-responses-v1",
            "index": 1
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 150,
    "total_tokens": 165,
    "completion_tokens_details": {
      "reasoning_tokens": 50
    }
  }
}
```

Streaming reasoning details

When streaming, reasoning details are delivered incrementally in `delta.reasoning_details`:

For Anthropic models:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "anthropic/claude-sonnet-4",
  "choices": [
    {
      "index": 0,
      "delta": {
        "reasoning": "Let me think.",
        "reasoning_details": [
          {
            "type": "reasoning.text",
            "text": "Let me think.",
            "signature": "anthropic-signature-xyz",
            "format": "anthropic-claude-v1",
            "index": 0
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

For OpenAI models (summary chunks during reasoning, then encrypted at end):

```
{
  "id": "chatcmpl-456",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "openai/o3-mini",
  "choices": [
    {
      "index": 0,
      "delta": {
        "reasoning": "Step 1:",
        "reasoning_details": [
          {
            "type": "reasoning.summary",
            "summary": "Step 1:",
            "format": "openai-responses-v1",
            "index": 0
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

#### [Provider-specific behavior](#provider-specific-behavior)

The AI Gateway automatically maps reasoning parameters to each provider's native format:

*   OpenAI: Maps `effort` to `reasoningEffort` and controls summary detail
*   Anthropic: Maps `max_tokens` to thinking budget tokens
*   Google: Maps to `thinkingConfig` with budget and visibility settings
*   Groq: Maps `exclude` to control reasoning format (hidden/parsed)
*   xAI: Maps `effort` to reasoning effort levels
*   Other providers: Generic mapping applied for compatibility

Automatic extraction: For models that don't natively support reasoning output, the gateway automatically extracts reasoning from `<think>` tags in the response.

### [Provider options](#provider-options)

The AI Gateway can route your requests across multiple AI providers for better reliability and performance. You can control which providers are used and in what order through the `providerOptions` parameter.

Example request

TypeScriptPython

provider-options.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const completion = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: false,
  // Provider options for gateway routing preferences
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Tokens used:', completion.usage);
```

provider-options.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=False,
    # Provider options for gateway routing preferences
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']  # Try Vertex AI first, then Anthropic
            }
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
print('Tokens used:', completion.usage)
```

Provider routing: In this example, the gateway will first attempt to use Vertex AI to serve the Claude model. If Vertex AI is unavailable or fails, it will fall back to Anthropic. Other providers are still available but will only be used after the specified providers.

#### [Model fallbacks](#model-fallbacks)

You can specify fallback models that will be tried in order if the primary model fails. There are two ways to do this:

###### Option 1: Direct `models` field

The simplest way is to use the `models` field directly at the top level of your request:

TypeScriptPython

model-fallbacks.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'openai/gpt-4o', // Primary model
  // @ts-ignore - models is a gateway extension
  models: ['openai/gpt-5-nano', 'gemini-2.0-flash'], // Fallback models
  messages: [
    {
      role: 'user',
      content: 'Write a haiku about TypeScript.',
    },
  ],
  stream: false,
});
 
console.log('Assistant:', completion.choices[0].message.content);
 
// Check which model was actually used
console.log('Model used:', completion.model);
```

model-fallbacks.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='openai/gpt-4o',  # Primary model
    messages=[
        {
            'role': 'user',
            'content': 'Write a haiku about TypeScript.'
        }
    ],
    stream=False,
    # models is a gateway extension for fallback models
    extra_body={
        'models': ['openai/gpt-5-nano', 'gemini-2.0-flash']  # Fallback models
    }
)
 
print('Assistant:', completion.choices[0].message.content)
 
# Check which model was actually used
print('Model used:', completion.model)
```

###### Option 2: Via provider options

Alternatively, you can specify model fallbacks through the `providerOptions.gateway.models` field:

TypeScriptPython

model-fallbacks-provider-options.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const completion = await openai.chat.completions.create({
  model: 'openai/gpt-4o', // Primary model
  messages: [
    {
      role: 'user',
      content: 'Write a haiku about TypeScript.',
    },
  ],
  stream: false,
  // Model fallbacks via provider options
  providerOptions: {
    gateway: {
      models: ['openai/gpt-5-nano', 'gemini-2.0-flash'], // Fallback models
    },
  },
});
 
console.log('Assistant:', completion.choices[0].message.content);
console.log('Model used:', completion.model);
```

model-fallbacks-provider-options.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='openai/gpt-4o',  # Primary model
    messages=[
        {
            'role': 'user',
            'content': 'Write a haiku about TypeScript.'
        }
    ],
    stream=False,
    # Model fallbacks via provider options
    extra_body={
        'providerOptions': {
            'gateway': {
                'models': ['openai/gpt-5-nano', 'gemini-2.0-flash']  # Fallback models
            }
        }
    }
)
 
print('Assistant:', completion.choices[0].message.content)
print('Model used:', completion.model)
```

Which approach to use: Both methods achieve the same result. Use the direct `models` field (Option 1) for simplicity, or use `providerOptions` (Option 2) if you're already using provider options for other configurations.

Both configurations will:

1.  Try the primary model (`openai/gpt-4o`) first
2.  If it fails, try `openai/gpt-5-nano`
3.  If that also fails, try `gemini-2.0-flash`
4.  Return the result from the first model that succeeds

#### [Streaming with provider options](#streaming-with-provider-options)

Provider options work with streaming requests as well:

TypeScriptPython

streaming-provider-options.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
// @ts-expect-error
const stream = await openai.chat.completions.create({
  model: 'anthropic/claude-sonnet-4',
  messages: [
    {
      role: 'user',
      content:
        'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
    },
  ],
  stream: true,
  providerOptions: {
    gateway: {
      order: ['vertex', 'anthropic'],
    },
  },
});
 
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    process.stdout.write(content);
  }
}
```

streaming-provider-options.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='anthropic/claude-sonnet-4',
    messages=[
        {
            'role': 'user',
            'content': 'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.'
        }
    ],
    stream=True,
    extra_body={
        'providerOptions': {
            'gateway': {
                'order': ['vertex', 'anthropic']
            }
        }
    }
)
 
for chunk in stream:
    content = chunk.choices[0].delta.content
    if content:
        print(content, end='', flush=True)
```

For more details about available providers and advanced provider configuration, see the [Provider Options documentation](/docs/ai-gateway/provider-options).

### [Parameters](#parameters)

The chat completions endpoint supports the following parameters:

#### [Required parameters](#required-parameters)

*   `model` (string): The model to use for the completion (e.g., `anthropic/claude-sonnet-4`)
*   `messages` (array): Array of message objects with `role` and `content` fields

#### [Optional parameters](#optional-parameters)

*   `stream` (boolean): Whether to stream the response. Defaults to `false`
*   `temperature` (number): Controls randomness in the output. Range: 0-2
*   `max_tokens` (integer): Maximum number of tokens to generate
*   `top_p` (number): Nucleus sampling parameter. Range: 0-1
*   `frequency_penalty` (number): Penalty for frequent tokens. Range: -2 to 2
*   `presence_penalty` (number): Penalty for present tokens. Range: -2 to 2
*   `stop` (string or array): Stop sequences for the generation
*   `tools` (array): Array of tool definitions for function calling
*   `tool_choice` (string or object): Controls which tools are called (`auto`, `none`, or specific function)
*   `providerOptions` (object): [Provider routing and configuration options](#provider-options)
*   `response_format` (object): Controls the format of the model's response
    *   For OpenAI standard format: `{ type: "json_schema", json_schema: { name, schema, strict?, description? } }`
    *   For legacy format: `{ type: "json", schema?, name?, description? }`
    *   For plain text: `{ type: "text" }`
    *   See [Structured outputs](#structured-outputs) for detailed examples

### [Message format](#message-format)

Messages support different content types:

#### [Text messages](#text-messages)

```
{
  "role": "user",
  "content": "Hello, how are you?"
}
```

#### [Multimodal messages](#multimodal-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "What's in this image?" },
    {
      "type": "image_url",
      "image_url": {
        "url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      }
    }
  ]
}
```

#### [File messages](#file-messages)

```
{
  "role": "user",
  "content": [
    { "type": "text", "text": "Summarize this document" },
    {
      "type": "file",
      "file": {
        "data": "JVBERi0xLjQKJcfsj6IKNSAwIG9iago8PAovVHlwZSAvUGFnZQo...",
        "media_type": "application/pdf",
        "filename": "document.pdf"
      }
    }
  ]
}
```

## [Image generation](#image-generation)

Generate images using AI models that support multimodal output through the OpenAI-compatible API. This feature allows you to create images alongside text responses using models like Google's Gemini 2.5 Flash Image.

Endpoint

`POST /chat/completions`

Parameters

To enable image generation, include the `modalities` parameter in your request:

*   `modalities` (array): Array of strings specifying the desired output modalities. Use `['text', 'image']` for both text and image generation, or `['image']` for image-only generation.

Example requests

TypeScriptPython

image-generation.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const completion = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [
    {
      role: 'user',
      content:
        'Generate a beautiful sunset over mountains and describe the scene.',
    },
  ],
  // @ts-expect-error - modalities not yet in OpenAI types but supported by gateway
  modalities: ['text', 'image'],
  stream: false,
});
 
const message = completion.choices[0].message;
 
// Text content is always a string
console.log('Text:', message.content);
 
// Images are in a separate array
if (message.images && Array.isArray(message.images)) {
  console.log(`Generated ${message.images.length} images:`);
  for (const [index, img] of message.images.entries()) {
    if (img.type === 'image_url' && img.image_url) {
      console.log(`Image ${index + 1}:`, {
        size: img.image_url.url?.length || 0,
        preview: `${img.image_url.url?.substring(0, 50)}...`,
      });
    }
  }
}
```

image-generation.py

```
import os
from openai import OpenAI
 
api_key = os.getenv('AI_GATEWAY_API_KEY') or os.getenv('VERCEL_OIDC_TOKEN')
 
client = OpenAI(
    api_key=api_key,
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
completion = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[
        {
            'role': 'user',
            'content': 'Generate a beautiful sunset over mountains and describe the scene.'
        }
    ],
    # Note: modalities parameter is not yet in OpenAI Python types but supported by our gateway
    extra_body={'modalities': ['text', 'image']},
    stream=False,
)
 
message = completion.choices[0].message
 
# Text content is always a string
print(f"Text: {message.content}")
 
# Images are in a separate array
if hasattr(message, 'images') and message.images:
    print(f"Generated {len(message.images)} images:")
    for i, img in enumerate(message.images):
        if img.get('type') == 'image_url' and img.get('image_url'):
            image_url = img['image_url']['url']
            data_size = len(image_url) if image_url else 0
            print(f"Image {i+1}: size: {data_size} chars")
            print(f"Preview: {image_url[:50]}...")
 
print(f'Tokens used: {completion.usage}')
```

Response format

When image generation is enabled, the response separates text content from generated images:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Here's a beautiful sunset scene over the mountains...",
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 15,
    "completion_tokens": 28,
    "total_tokens": 43
  }
}
```

### [Response structure details](#response-structure-details)

*   `content`: Contains the text description as a string
*   `images`: Array of generated images, each with:
    *   `type`: Always `"image_url"`
    *   `image_url.url`: Base64-encoded data URI of the generated image

### [Streaming responses](#streaming-responses)

For streaming requests, images are delivered in delta chunks:

```
{
  "id": "chatcmpl-123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "google/gemini-2.5-flash-image-preview",
  "choices": [
    {
      "index": 0,
      "delta": {
        "images": [
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
            }
          }
        ]
      },
      "finish_reason": null
    }
  ]
}
```

### [Handling streaming image responses](#handling-streaming-image-responses)

When processing streaming responses, check for both text content and images in each delta:

TypeScriptPython

streaming-images.ts

```
import OpenAI from 'openai';
 
const openai = new OpenAI({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const stream = await openai.chat.completions.create({
  model: 'google/gemini-2.5-flash-image-preview',
  messages: [{ role: 'user', content: 'Generate a sunset image' }],
  // @ts-expect-error - modalities not yet in OpenAI types
  modalities: ['text', 'image'],
  stream: true,
});
 
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta;
 
  // Handle text content
  if (delta?.content) {
    process.stdout.write(delta.content);
  }
 
  // Handle images
  if (delta?.images) {
    for (const img of delta.images) {
      if (img.type === 'image_url' && img.image_url) {
        console.log(`\n[Image received: ${img.image_url.url.length} chars]`);
      }
    }
  }
}
```

streaming-images.py

```
import os
from openai import OpenAI
 
client = OpenAI(
    api_key=os.getenv('AI_GATEWAY_API_KEY'),
    base_url='https://ai-gateway.vercel.sh/v1'
)
 
stream = client.chat.completions.create(
    model='google/gemini-2.5-flash-image-preview',
    messages=[{'role': 'user', 'content': 'Generate a sunset image'}],
    extra_body={'modalities': ['text', 'image']},
    stream=True,
)
 
for chunk in stream:
    if chunk.choices and chunk.choices[0].delta:
        delta = chunk.choices[0].delta
 
        # Handle text content
        if hasattr(delta, 'content') and delta.content:
            print(delta.content, end='', flush=True)
 
        # Handle images
        if hasattr(delta, 'images') and delta.images:
            for img in delta.images:
                if img.get('type') == 'image_url' and img.get('image_url'):
                    image_url = img['image_url']['url']
                    print(f"\n[Image received: {len(image_url)} chars]")
```

Image generation support: Currently, image generation is supported by Google's Gemini 2.5 Flash Image model. The generated images are returned as base64-encoded data URIs in the response. For more detailed information about image generation capabilities, see the [Image Generation documentation](/docs/ai-gateway/image-generation).

## [Embeddings](#embeddings)

Generate vector embeddings from input text for semantic search, similarity matching, and retrieval-augmented generation (RAG).

Endpoint

`POST /embeddings`

Example request

TypeScriptPython

embeddings.ts

```
import OpenAI from 'openai';
 
const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
 
const openai = new OpenAI({
  apiKey,
  baseURL: 'https://ai-gateway.vercel.sh/v1',
});
 
const response = await openai.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Sunny day at the beach',
});
 
console.log(response.data[0].embedding);
```

embeddings.py

```
import os
from openai import OpenAI
 
api_key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")
 
client = OpenAI(
    api_key=api_key,
    base_url="https://ai-gateway.vercel.sh/v1",
)
 
response = client.embeddings.create(
    model="openai/text-embedding-3-small",
    input="Sunny day at the beach",
)
 
print(response.data[0].embedding)
```

Response format

```
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [-0.0038, 0.021, ...]
    },
  ],
  "model": "openai/text-embedding-3-small",
  "usage": {
    "prompt_tokens": 6,
    "total_tokens": 6
  },
  "providerMetadata": {
    "gateway": {
      "routing": { ... }, // Detailed routing info
      "cost": "0.00000012"
    }
  }
}
```

Dimensions parameter

You can set the root-level `dimensions` field (from the [OpenAI Embeddings API spec](https://platform.openai.com/docs/api-reference/embeddings/create)) and the gateway will auto-map it to each provider's expected field; `providerOptions.[provider]` still passes through as-is and isn't required for `dimensions` to work.

TypeScriptPython

embeddings-dimensions.ts

```
const response = await openai.embeddings.create({
  model: 'openai/text-embedding-3-small',
  input: 'Sunny day at the beach',
  dimensions: 768,
});
```

embeddings-dimensions.py

```
response = client.embeddings.create(
    model='openai/text-embedding-3-small',
    input='Sunny day at the beach',
    dimensions=768,
)
```

## [Error handling](#error-handling)

The API returns standard HTTP status codes and error responses:

### [Common error codes](#common-error-codes)

*   `400 Bad Request`: Invalid request parameters
*   `401 Unauthorized`: Invalid or missing authentication
*   `403 Forbidden`: Insufficient permissions
*   `404 Not Found`: Model or endpoint not found
*   `429 Too Many Requests`: Rate limit exceeded
*   `500 Internal Server Error`: Server error

### [Error response format](#error-response-format)

```
{
  "error": {
    "message": "Invalid request: missing required parameter 'model'",
    "type": "invalid_request_error",
    "param": "model",
    "code": "missing_parameter"
  }
}
```

## [Direct REST API usage](#direct-rest-api-usage)

If you prefer to use the AI Gateway API directly without the OpenAI client libraries, you can make HTTP requests using any HTTP client. Here are examples using `curl` and JavaScript's `fetch` API:

### [List models](#list-models)

cURLJavaScript

list-models.sh

```
curl -X GET "https://ai-gateway.vercel.sh/v1/models" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json"
```

list-models.js

```
const response = await fetch('https://ai-gateway.vercel.sh/v1/models', {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
 
const models = await response.json();
console.log(models);
```

### [Basic chat completion](#basic-chat-completion)

cURLJavaScript

chat-completion.sh

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": false
  }'
```

chat-completion.js

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Streaming chat completion](#streaming-chat-completion)

cURLJavaScript

streaming-chat.sh

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Write a one-sentence bedtime story about a unicorn."
      }
    ],
    "stream": true
  }' \
  --no-buffer
```

streaming-chat.js

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'Write a one-sentence bedtime story about a unicorn.',
        },
      ],
      stream: true,
    }),
  },
);
 
const reader = response.body.getReader();
const decoder = new TextDecoder();
 
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
 
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');
 
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') {
        console.log('Stream complete');
        break;
      } else if (data.trim()) {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          process.stdout.write(content);
        }
      }
    }
  }
}
```

### [Image analysis](#image-analysis)

cURLJavaScript

image-analysis.sh

```
# First, convert your image to base64
IMAGE_BASE64=$(base64 -i ./path/to/image.png)
 
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "Describe this image in detail."
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "data:image/png;base64,'"$IMAGE_BASE64"'",
              "detail": "auto"
            }
          }
        ]
      }
    ],
    "stream": false
  }'
```

image-analysis.js

```
import fs from 'node:fs';
 
// Read the image file as base64
const imageBuffer = fs.readFileSync('./path/to/image.png');
const imageBase64 = imageBuffer.toString('base64');
 
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image in detail.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageBase64}`,
                detail: 'auto',
              },
            },
          ],
        },
      ],
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Tool calls](#tool-calls)

cURLJavaScript

tool-calls.sh

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "What is the weather like in San Francisco?"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"],
                "description": "The unit for temperature"
              }
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto",
    "stream": false
  }'
```

tool-calls.js

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: 'What is the weather like in San Francisco?',
        },
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get the current weather in a given location',
            parameters: {
              type: 'object',
              properties: {
                location: {
                  type: 'string',
                  description: 'The city and state, e.g. San Francisco, CA',
                },
                unit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                  description: 'The unit for temperature',
                },
              },
              required: ['location'],
            },
          },
        },
      ],
      tool_choice: 'auto',
      stream: false,
    }),
  },
);
 
const result = await response.json();
console.log(result);
```

### [Provider options](#provider-options)

cURLJavaScript

provider-options.sh

```
curl -X POST "https://ai-gateway.vercel.sh/v1/chat/completions" \
  -H "Authorization: Bearer $AI_GATEWAY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "anthropic/claude-sonnet-4",
    "messages": [
      {
        "role": "user",
        "content": "Tell me the history of the San Francisco Mission-style burrito in two paragraphs."
      }
    ],
    "stream": false,
    "providerOptions": {
      "gateway": {
        "order": ["vertex", "anthropic"]
      }
    }
  }'
```

provider-options.js

```
const response = await fetch(
  'https://ai-gateway.vercel.sh/v1/chat/completions',
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content:
            'Tell me the history of the San Francisco Mission-style burrito in two paragraphs.',
        },
      ],
      stream: false,
      providerOptions: {
        gateway: {
          order: ['vertex', 'anthropic'], // Try Vertex AI first, then Anthropic
        },
      },
    }),
  },
);
 
const result = await response.json();
console.log(result);
```