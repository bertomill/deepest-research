import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

export async function POST(req: Request) {
  const { location }: { location: LocationData } = await req.json();

  const locationName = location.city
    ? `${location.city}, ${location.country}`
    : location.country || `coordinates ${location.lat}, ${location.lng}`;

  interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source?: { name: string };
  }

  // Fetch news from the location using GNews API (free tier)
  let newsArticles: NewsArticle[] = [];
  try {
    const newsResponse = await fetch(
      `https://gnews.io/api/v4/top-headlines?country=${getCountryCode(location.country || '')}&lang=en&max=10&apikey=${process.env.GNEWS_API_KEY || 'demo'}`
    );

    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      newsArticles = newsData.articles || [];
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }

  const newsContext = newsArticles.length > 0
    ? newsArticles.map(article => `- ${article.title}: ${article.description}`).join('\n')
    : 'No recent news available for this location.';

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are helping a professional researcher discover interesting research topics.

Location: ${locationName}
Recent news from this region:
${newsContext}

Based on this location and recent news, generate 4-5 compelling professional research topics that would be valuable for:
- Financial analysts
- Investors
- Strategy consultants
- Market researchers
- Business intelligence professionals

Each topic should be:
1. Specific and actionable (not vague)
2. Tied to business/market/competitive intelligence
3. Based on real trends or companies from this region
4. Something that would provide strategic insights

Use web search to find current information about companies, markets, or trends in this region to enhance your research topic suggestions with recent developments.

Format: Return ONLY a JSON array of strings, no other text. Example:
["Deep dive into [Company]'s market dominance in [sector]", "Analysis of [trend] in [country]'s [industry]"]`;

  try {
    // Build user_location for localized search results
    interface UserLocation {
      type: 'approximate';
      country: string;
      city?: string;
    }

    // Convert country name to 2-letter ISO code
    const countryCode = getCountryCode(location.country || '');

    const userLocation: UserLocation = {
      type: 'approximate',
      country: countryCode,
    };

    if (location.city) {
      userLocation.city = location.city;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
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
          max_uses: 5,
          user_location: userLocation,
        },
      ],
    });

    // Extract text from response
    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => ('text' in block ? block.text : ''))
      .join('\n');

    // Try to parse JSON from the response
    let suggestions: string[] = [];
    try {
      // Extract JSON array from the response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Fallback: split by newlines and clean up
      suggestions = text
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, '').trim())
        .filter((line: string) => line.length > 10)
        .slice(0, 5);
    }

    return Response.json({
      location: locationName,
      news: newsArticles.slice(0, 5).map(article => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source?.name,
      })),
      suggestions,
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    return Response.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

// Helper function to get ISO country code
function getCountryCode(countryName: string): string {
  const countryMap: Record<string, string> = {
    'United States': 'us',
    'United Kingdom': 'gb',
    'Canada': 'ca',
    'Australia': 'au',
    'Germany': 'de',
    'France': 'fr',
    'Italy': 'it',
    'Spain': 'es',
    'Japan': 'jp',
    'China': 'cn',
    'India': 'in',
    'Brazil': 'br',
    'Mexico': 'mx',
    'Netherlands': 'nl',
    'Sweden': 'se',
    'Norway': 'no',
    'Denmark': 'dk',
    'Finland': 'fi',
    'Poland': 'pl',
    'Belgium': 'be',
    'Switzerland': 'ch',
    'Austria': 'at',
    'Ireland': 'ie',
    'Portugal': 'pt',
    'Greece': 'gr',
    'Czech Republic': 'cz',
    'Romania': 'ro',
    'Hungary': 'hu',
    'Singapore': 'sg',
    'South Korea': 'kr',
    'Taiwan': 'tw',
    'Hong Kong': 'hk',
    'Israel': 'il',
    'Turkey': 'tr',
    'Saudi Arabia': 'sa',
    'United Arab Emirates': 'ae',
    'South Africa': 'za',
    'Egypt': 'eg',
    'Nigeria': 'ng',
    'Argentina': 'ar',
    'Chile': 'cl',
    'Colombia': 'co',
    'Peru': 'pe',
    'New Zealand': 'nz',
  };

  return countryMap[countryName] || 'us';
}
