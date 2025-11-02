import { createGateway } from '@ai-sdk/gateway';
import { streamText } from 'ai';

export const runtime = 'edge';

// Tavily API search function
async function searchWeb(query: string) {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      console.error('Tavily API error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Web search error:', error);
    return null;
  }
}

export async function POST(req: Request) {
  const { prompt, models: modelIds } = await req.json();

  // Create gateway instance with API key
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  // Model name mapping
  const modelNameMap: Record<string, string> = {
    'anthropic/claude-sonnet-4.5': 'Claude Sonnet 4.5',
    'anthropic/claude-haiku-4.5': 'Claude Haiku 4.5',
    'anthropic/claude-3.7-sonnet': 'Claude 3.7 Sonnet',
    'openai/gpt-5': 'GPT-5',
    'openai/gpt-4.1': 'GPT-4.1',
    'openai/gpt-4o': 'GPT-4o',
    'openai/o3': 'O3',
    'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
    'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
    'xai/grok-4': 'Grok 4',
    'xai/grok-4-reasoning': 'Grok 4 Reasoning',
    'xai/grok-4-fast-reasoning': 'Grok 4 Fast Reasoning',
    'xai/grok-4-fast-non-reasoning': 'Grok 4 Fast Non-Reasoning',
    'deepseek/deepseek-v3': 'DeepSeek V3',
    'deepseek/deepseek-r1': 'DeepSeek R1',
    'meta/llama-3.3-70b': 'Llama 3.3 70B',
  };

  // Build models array from IDs
  const models = (modelIds as string[]).map(modelId => ({
    name: modelNameMap[modelId] || modelId,
    model: gateway(modelId),
  }));

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE data
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Pre-fetch web search results for all models
      sendEvent('search-started', {});
      const webData = await searchWeb(prompt);
      sendEvent('search-complete', { hasResults: !!webData });

      // Build enhanced prompt with web search results
      let enhancedPrompt = prompt;
      if (webData && webData.results && webData.results.length > 0) {
        enhancedPrompt = `${prompt}

WEB SEARCH RESULTS (Current information from the web):

${webData.answer ? `Summary: ${webData.answer}\n\n` : ''}${webData.results.map((result: any, i: number) => `
[${i + 1}] ${result.title}
URL: ${result.url}
${result.content}
`).join('\n')}

Please use this current web information to provide an up-to-date, accurate answer to the user's question.`;
      }

      // Query all models in parallel and stream results as they come in
      const responsePromises = models.map(async ({ name, model }) => {
        try {
          console.log(`[${name}] Starting query...`);
          const result = await streamText({
            model,
            prompt: enhancedPrompt,
          });

          let fullText = '';

          // Stream chunks as they arrive
          for await (const chunk of result.textStream) {
            fullText += chunk;
            sendEvent('model-chunk', { name, chunk });
          }

          console.log(`[${name}] ✓ Completed. Text length: ${fullText.length}`);
          sendEvent('model-complete', { name, text: fullText, error: null });
          return { name, text: fullText, error: null };
        } catch (error) {
          console.error(`[${name}] ✗ Error:`, error);
          console.error(`[${name}] Error details:`, {
            message: error instanceof Error ? error.message : 'Unknown error',
            name: error instanceof Error ? error.name : 'Unknown',
            stack: error instanceof Error ? error.stack : undefined,
          });
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendEvent('model-complete', { name, text: null, error: errorMessage });
          return { name, text: null, error: errorMessage };
        }
      });

      // Wait for all model responses
      const responses = await Promise.all(responsePromises);

      // Create synthesis prompt with all responses
      const synthesisPrompt = `You are a research analyst. A user asked: "${prompt}"

Here are responses from 4 different AI models:

${responses.map((r) => `
**${r.name}:**
${r.error ? `Error: ${r.error}` : r.text}
`).join('\n')}

Your task:
1. Compare and contrast these responses
2. Identify agreements and disagreements
3. Evaluate the quality and accuracy of each response
4. Synthesize the best possible answer that combines their strengths
5. Highlight any important nuances or caveats

Provide a comprehensive, well-researched answer.`;

      // Stream synthesis
      try {
        const synthesisResult = await streamText({
          model: gateway('anthropic/claude-sonnet-4.5'),
          prompt: synthesisPrompt,
        });

        let fullSynthesis = '';

        for await (const chunk of synthesisResult.textStream) {
          fullSynthesis += chunk;
          sendEvent('synthesis-chunk', { chunk });
        }

        sendEvent('synthesis-complete', { text: fullSynthesis });
      } catch {
        sendEvent('synthesis-complete', { text: null });
      }

      // Signal completion
      sendEvent('done', {});
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}