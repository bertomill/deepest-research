'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ModelResponse {
  name: string;
  text: string | null;
  error: string | null;
}

const MODELS = [
  'Claude Sonnet 4.5',
  'GPT-5',
  'Gemini 2.5 Pro',
  'Grok 4 Fast',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponses([]);
    setSynthesis(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query }),
      });

      const data = await res.json();
      setResponses(data.responses);
      setSynthesis(data.synthesis);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        <form onSubmit={handleSubmit} className="mb-12">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask something..."
            className="w-full border-b-2 border-zinc-300 bg-transparent py-3 text-2xl outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
            disabled={loading}
          />
        </form>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            // Loading skeletons
            MODELS.map((modelName) => (
              <div
                key={modelName}
                className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
              >
                <h3 className="mb-4 text-lg font-semibold">{modelName}</h3>
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ))
          ) : (
            // Actual responses
            responses.map((response, index) => (
              <div
                key={index}
                className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
              >
                <h3 className="mb-4 text-lg font-semibold">{response.name}</h3>
                {response.error ? (
                  <p className="text-sm text-red-500">{response.error}</p>
                ) : (
                  <div className="prose prose-sm prose-zinc dark:prose-invert max-w-none">
                    <ReactMarkdown>{response.text || ''}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Synthesis Section - only show after models have responded */}
        {responses.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Synthesized Research</h2>
            {!synthesis ? (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-8 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-blue-200 dark:bg-blue-900" />
                  <div className="h-4 w-full animate-pulse rounded bg-blue-200 dark:bg-blue-900" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-blue-200 dark:bg-blue-900" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-blue-200 dark:bg-blue-900" />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-blue-200 bg-blue-50/50 p-8 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="prose prose-zinc dark:prose-invert max-w-none">
                  <ReactMarkdown>{synthesis || ''}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
