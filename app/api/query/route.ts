import { createGateway } from '@ai-sdk/gateway';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Create gateway instance with API key
  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  // Define the models you want to query via AI Gateway
  const models = [
    { name: 'Claude Sonnet 4.5', model: gateway('anthropic/claude-sonnet-4.5') },
    { name: 'GPT-5', model: gateway('openai/gpt-5') },
    { name: 'Gemini 2.5 Pro', model: gateway('google/gemini-2.5-pro') },
    { name: 'Grok 4 Fast', model: gateway('xai/grok-4-fast-reasoning') },
  ];

  // Query all models in parallel
  const responses = await Promise.all(
    models.map(async ({ name, model }) => {
      try {
        const result = await streamText({
          model,
          prompt,
        });

        const text = await result.text;
        return { name, text, error: null };
      } catch (error) {
        return {
          name,
          text: null,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

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

  // Get synthesis from Claude Sonnet 4.5
  let synthesis = null;
  try {
    const synthesisResult = await streamText({
      model: gateway('anthropic/claude-sonnet-4.5'),
      prompt: synthesisPrompt,
    });
    synthesis = await synthesisResult.text;
  } catch {
    synthesis = null;
  }

  return Response.json({ responses, synthesis });
}