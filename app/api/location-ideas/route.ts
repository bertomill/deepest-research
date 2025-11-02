import { createGateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { city, country, lat, lng } = await req.json();

    const gateway = createGateway({
      apiKey: process.env.AI_GATEWAY_API_KEY,
    });

    const locationName = city && country
      ? `${city}, ${country}`
      : country || `coordinates (${lat.toFixed(2)}, ${lng.toFixed(2)})`;

    const prompt = `Generate 5 compelling research topic ideas related to ${locationName}.

Consider:
- Local economy, industries, and business trends
- Technology and innovation hubs
- Cultural and social developments
- Environmental and sustainability topics
- Political and policy issues
- Infrastructure and urban development

Format each idea as a concise, specific research question (1-2 sentences max).
Make them actionable and interesting for business/academic research.

Return ONLY a JSON array of 5 strings, like:
["idea 1", "idea 2", "idea 3", "idea 4", "idea 5"]`;

    const result = await generateText({
      model: gateway('anthropic/claude-sonnet-4.5'),
      prompt,
    });

    // Parse the JSON response
    const ideas = JSON.parse(result.text);

    return Response.json({ ideas, location: locationName });
  } catch (error) {
    console.error('Error generating location ideas:', error);
    return Response.json({ error: 'Failed to generate ideas' }, { status: 500 });
  }
}
