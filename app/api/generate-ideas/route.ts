import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

interface PersonalizationData {
  location?: string;
  jobTitle?: string;
  industry?: string;
}

export async function POST(req: Request) {
  const { location, jobTitle, industry }: PersonalizationData = await req.json();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
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

Generate 5 compelling professional research topics that would be valuable for:
- Financial analysts
- Investors
- Strategy consultants
- Market researchers
- Business intelligence professionals

Each topic should be:
1. Specific and actionable (not vague)
2. Tied to current business/market/competitive intelligence trends
3. Based on real emerging trends, technologies, or market shifts
4. Something that would provide strategic insights
5. Timely and relevant to 2025

Use web search to find current information about emerging trends, technologies, and market dynamics to make your research topic suggestions highly relevant and timely.

Format: Return ONLY a JSON array of strings, no other text. Example:
["Deep dive into AI chip market consolidation and supply chain shifts", "Analysis of subscription fatigue impact on SaaS valuations"]`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      tools: [
        {
          type: 'web_search_20250305',
          name: 'web_search',
          max_uses: 3,
        },
      ],
    });

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => ('text' in block ? block.text : ''))
      .join('\n');

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
