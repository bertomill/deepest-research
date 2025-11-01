import { createGateway } from '@ai-sdk/gateway';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { query } = await req.json();

  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const questionPrompt = `You are a research assistant. A user wants to research: "${query}"

Generate 3-4 clarifying questions that would help refine this research query and get better, more targeted results.

Focus on:
- Timeframe (if relevant)
- Specific aspects or focus areas
- Depth vs breadth
- Target audience or use case
- Geographic scope (if relevant)

Return ONLY a JSON array of questions, each as a simple string. Example format:
["Question 1?", "Question 2?", "Question 3?"]

Do not include any other text or explanation.`;

  try {
    const result = await streamText({
      model: gateway('anthropic/claude-sonnet-4.5'),
      prompt: questionPrompt,
    });

    const text = await result.text;

    // Strip markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/```json\n?/, '').replace(/```\n?$/, '');
    }

    // Parse the JSON response
    const questions = JSON.parse(cleanedText.trim());

    return Response.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return Response.json({ questions: [] });
  }
}
