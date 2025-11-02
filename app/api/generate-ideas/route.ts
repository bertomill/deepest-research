import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

export const runtime = 'edge';

interface PersonalizationData {
  location?: string;
  jobTitle?: string;
  industry?: string;
}

export async function POST(req: Request) {
  const { location, jobTitle, industry }: PersonalizationData = await req.json();

  const gateway = createGateway({
    apiKey: process.env.AI_GATEWAY_API_KEY,
  });

  // Build personalized context
  let personalizationContext = '';
  if (location || jobTitle || industry) {
    personalizationContext = '\n\nPersonalization context:';
    if (location) personalizationContext += `\n- User is based in: ${location}`;
    if (jobTitle) personalizationContext += `\n- User's role: ${jobTitle}`;
    if (industry) personalizationContext += `\n- User's industry: ${industry}`;
    personalizationContext += '\n\nTailor the research topics to be especially relevant to this user\'s context.';
  }

  const prompt = `You are helping a professional researcher discover interesting research topics.${personalizationContext}

Generate 5 concise research topics (8-12 words each) that would be valuable for business professionals.

Guidelines:
- Keep each topic brief and clear (8-12 words maximum)
- Focus on current trends and emerging opportunities
- Make them specific enough to be actionable
- Tie to real-world business, technology, or market developments
- Ensure they're timely and relevant to 2025

Format: Return ONLY a JSON array of strings, no other text. Example:
["AI chip market consolidation trends", "Subscription fatigue impact on SaaS growth"]`;

  try {
    const result = await generateText({
      model: gateway('anthropic/claude-sonnet-4.5'),
      prompt: prompt,
    });

    const text = result.text;

    // Try to parse JSON from the response
    let ideas: string[] = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ideas = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: split by newlines and clean up
      ideas = text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 5);
    }

    return Response.json({
      ideas,
    });
  } catch (error) {
    console.error('Error generating ideas:', error);
    return Response.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}
