# Deepest Research

A multi-model AI research tool that queries multiple leading AI models in parallel and synthesizes their responses for comprehensive insights.

## Features

- **Multi-Model Querying**: Simultaneously queries Claude Sonnet 4.5, GPT-5, Gemini 2.5 Pro, and Grok 4 Fast
- **Dynamic Question Refinement**: Typeform-style interface to refine your research query before execution
- **Intelligent Synthesis**: Analyzes and compares all model responses to provide comprehensive, synthesized insights
- **Clean UX**: Minimalist design with expandable/scrollable response cards and markdown rendering

## Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- Vercel AI SDK with AI Gateway
- React Markdown

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file and add your Vercel AI Gateway API key:
   ```
   AI_GATEWAY_API_KEY=your-key-here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deployment on Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the `AI_GATEWAY_API_KEY` environment variable in Vercel project settings
4. Deploy

## How It Works

1. User enters a research query
2. System generates clarifying questions to refine the query
3. User answers questions (optional)
4. Query is sent to 4 AI models in parallel via Vercel AI Gateway
5. Responses are displayed side-by-side
6. A synthesis model analyzes all responses and provides a comprehensive summary
