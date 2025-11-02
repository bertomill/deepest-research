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

interface Task {
  id: string;
  title: string;
  description: string;
  prompt: string;
}

export async function POST(req: Request) {
  const { tasks, taskAssignments, originalQuery }: {
    tasks: Task[];
    taskAssignments: Record<string, string[]>;
    originalQuery: string;
  } = await req.json();

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

  // Build a map of model ID to task prompt
  const modelTaskMap: Record<string, string> = {};
  for (const task of tasks) {
    const assignedModels = taskAssignments[task.id] || [];
    for (const modelId of assignedModels) {
      modelTaskMap[modelId] = task.prompt;
    }
  }

  // Create a readable stream for Server-Sent Events
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send SSE data
      const sendEvent = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Pre-fetch web search results for the original query
      sendEvent('search-started', {});
      const webData = await searchWeb(originalQuery);
      sendEvent('search-complete', { hasResults: !!webData });

      // Build web search context to append to each task
      let webSearchContext = '';
      if (webData && webData.results && webData.results.length > 0) {
        webSearchContext = `\n\nWEB SEARCH RESULTS (Current information from the web):\n\n${webData.answer ? `Summary: ${webData.answer}\n\n` : ''}${webData.results.map((result: any, i: number) => `
[${i + 1}] ${result.title}
URL: ${result.url}
${result.content}
`).join('\n')}\n\nPlease use this current web information to provide an up-to-date, accurate answer.`;
      }

      // Query all models in parallel with their assigned task prompts
      const responsePromises = Object.entries(modelTaskMap).map(async ([modelId, taskPrompt]) => {
        const modelName = modelNameMap[modelId] || modelId;
        try {
          console.log(`[${modelName}] Starting task-based query...`);

          const enhancedPrompt = taskPrompt + webSearchContext;

          const result = await streamText({
            model: gateway(modelId),
            prompt: enhancedPrompt,
          });

          let fullText = '';

          // Stream chunks as they arrive
          for await (const chunk of result.textStream) {
            fullText += chunk;
            sendEvent('model-chunk', { name: modelName, chunk });
          }

          console.log(`[${modelName}] ✓ Completed. Text length: ${fullText.length}`);
          sendEvent('model-complete', { name: modelName, text: fullText, error: null });
          return { name: modelName, text: fullText, error: null };
        } catch (error) {
          console.error(`[${modelName}] ✗ Error with model ID ${modelId}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`[${modelName}] Error message:`, errorMessage);
          console.error(`[${modelName}] Full error:`, JSON.stringify(error, null, 2));
          sendEvent('model-complete', { name: modelName, text: null, error: errorMessage });
          return { name: modelName, text: null, error: errorMessage };
        }
      });

      // Wait for all model responses
      const responses = await Promise.all(responsePromises);

      // Create synthesis prompt that acknowledges the task-based approach
      const synthesisPrompt = `You are a research analyst. A user asked: "${originalQuery}"

We broke this research into specialized tasks and assigned different AI models to focus on specific aspects:

${tasks.map((task) => {
  const assignedModels = taskAssignments[task.id] || [];
  const taskResponses = responses.filter(r => {
    const modelId = Object.entries(modelNameMap).find(([, name]) => name === r.name)?.[0];
    return modelId && assignedModels.includes(modelId);
  });

  return `**Task: ${task.title}**
Focus: ${task.description}

Models assigned to this task:
${taskResponses.map(r => `\n**${r.name}:**\n${r.error ? `Error: ${r.error}` : r.text}`).join('\n')}`;
}).join('\n\n')}

Your task:
1. Synthesize the findings from each specialized research task
2. Identify how the different task findings complement each other
3. Note any agreements or disagreements between models on the same task
4. Combine insights to provide a comprehensive answer to the original question
5. Highlight important nuances or caveats

Provide a well-structured, comprehensive answer that draws from all research tasks.`;

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
