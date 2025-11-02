import { createGateway } from '@ai-sdk/gateway';
import { streamText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { query } = await req.json();

  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  const questionPrompt = `You are a research assistant. A user wants to research: "${query}"

Generate 4 brief, focused clarifying questions (8-12 words each) to refine this query.

Keep questions simple and direct. Focus on:
- Timeframe
- Specific focus
- Use case
- Scope

Return ONLY a JSON array of short questions. Example:
["What timeframe interests you?", "Which aspect matters most?", "Who is the target audience?"]

No extra text.`;

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
