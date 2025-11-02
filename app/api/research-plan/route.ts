import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { query, answers } = await req.json();

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build context from answers if provided
  let contextSection = '';
  if (answers && answers.length > 0) {
    contextSection = '\n\nUser provided context:\n' + answers.map((a: string, i: number) => `${i + 1}. ${a}`).join('\n');
  }

  const prompt = `You are a research strategy expert. Given this research question, create a strategic plan that breaks down the research into 3-4 distinct research tasks that different AI models can work on in parallel.

Research Question: ${query}${contextSection}

Create a research plan with 3-4 research tasks. Each task should:
- Focus on a specific angle or aspect of the question
- Be complementary to other tasks (not overlapping)
- Be clearly defined so an AI model knows exactly what to research

Return ONLY a JSON object with this structure:
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Brief title (4-6 words)",
      "description": "What this task focuses on (1-2 sentences)",
      "prompt": "The specific research prompt for the AI model"
    }
  ]
}

Example for "How do I customize Shopify sites?":
{
  "tasks": [
    {
      "id": "task-1",
      "title": "Technical customization approaches",
      "description": "Research the technical methods and tools available for Shopify customization",
      "prompt": "Research and explain the different technical approaches to customizing Shopify sites, including Liquid templating, theme development, and app development. Focus on what's technically possible and the skill levels required."
    },
    {
      "id": "task-2",
      "title": "No-code solutions and apps",
      "description": "Explore user-friendly customization options that don't require coding",
      "prompt": "Research no-code and low-code solutions for Shopify customization, including drag-and-drop builders, popular apps, and the Shopify theme editor. Focus on what non-technical users can accomplish."
    },
    {
      "id": "task-3",
      "title": "Best practices and examples",
      "description": "Find real-world examples and industry best practices",
      "prompt": "Research best practices for Shopify customization, common pitfalls to avoid, and showcase successful examples of customized Shopify stores. Focus on practical guidance and proven approaches."
    }
  ]
}

Now create the research plan:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => ('text' in block ? block.text : ''))
      .join('\n');

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0]);
      return Response.json(plan);
    }

    return Response.json(
      { error: 'Failed to parse research plan' },
      { status: 500 }
    );
  } catch (error) {
    console.error('Error generating research plan:', error);
    return Response.json(
      { error: 'Failed to generate research plan' },
      { status: 500 }
    );
  }
}
