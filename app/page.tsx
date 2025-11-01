'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const InteractiveGlobe = dynamic(() => import('./components/InteractiveGlobe'), {
  ssr: false,
});

interface ModelResponse {
  name: string;
  text: string | null;
  error: string | null;
}

interface LocationData {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
}

const MODELS = [
  'Claude Sonnet 4.5',
  'GPT-5',
  'Gemini 2.5 Pro',
  'Grok 4 Fast',
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [responses, setResponses] = useState<ModelResponse[]>([]);
  const [synthesis, setSynthesis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [synthesisExpanded, setSynthesisExpanded] = useState(false);

  // Globe-related state
  const [showGlobe, setShowGlobe] = useState(true);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationNews, setLocationNews] = useState<NewsArticle[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const toggleCard = (index: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCards(newExpanded);
  };

  const handleLocationSelect = async (location: LocationData) => {
    setLoadingLocation(true);
    setSelectedLocation(
      location.city
        ? `${location.city}, ${location.country}`
        : location.country || `${location.lat}, ${location.lng}`
    );

    try {
      const res = await fetch('/api/location-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      });

      const data = await res.json();
      setLocationSuggestions(data.suggestions || []);
      setLocationNews(data.news || []);
    } catch (error) {
      console.error('Error fetching location data:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowGlobe(false);
    setLocationSuggestions([]);
    setLocationNews([]);
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoadingQuestions(true);
    setShowQuestions(false);
    setResponses([]);
    setSynthesis(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers(new Array(data.questions?.length || 0).fill(''));
      setCurrentQuestionIndex(0);
      setShowQuestions(true);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleStartResearch();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleStartResearch = async () => {
    setLoading(true);
    setShowQuestions(false);
    setExpandedCards(new Set());
    setSynthesisExpanded(false);

    // Build enriched prompt with Q&A context
    const enrichedPrompt = `${query}

Additional context from user:
${questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided'}`).join('\n\n')}`;

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: enrichedPrompt }),
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
        <div className="mb-4 flex items-center justify-between">
          <form onSubmit={handleInitialSubmit} className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to research?"
              className="w-full border-b-2 border-zinc-300 bg-transparent py-3 text-2xl outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
              disabled={loading || loadingQuestions}
            />
          </form>
          {!loading && !loadingQuestions && !showQuestions && !responses.length && (
            <button
              onClick={() => setShowGlobe(!showGlobe)}
              className="ml-4 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {showGlobe ? 'Hide Globe' : 'Explore Globe'}
            </button>
          )}
        </div>

        {/* Globe and location suggestions */}
        {showGlobe && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-12">
            <InteractiveGlobe onLocationSelect={handleLocationSelect} />

            {loadingLocation && (
              <div className="mt-8 text-center text-zinc-500">
                Fetching news and generating research topics...
              </div>
            )}

            {selectedLocation && locationSuggestions.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold">
                  Research Ideas from {selectedLocation}
                </h3>

                {locationNews.length > 0 && (
                  <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h4 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      Recent News
                    </h4>
                    <div className="space-y-2">
                      {locationNews.map((article, index) => (
                        <div key={index} className="text-sm">
                          <a
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-zinc-900 hover:underline dark:text-zinc-100"
                          >
                            {article.title}
                          </a>
                          <p className="text-zinc-600 dark:text-zinc-400">
                            {article.description}
                          </p>
                          <p className="text-xs text-zinc-400">{article.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <p className="text-sm font-medium">{suggestion}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading questions state */}
        {loadingQuestions && (
          <div className="mb-12 text-center text-zinc-500">
            Generating clarifying questions...
          </div>
        )}

        {/* Typeform-style questions */}
        {showQuestions && questions.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <span className="text-sm text-zinc-500">
                {currentQuestionIndex + 1} / {questions.length}
              </span>
              <div className="h-1 flex-1 rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-1 rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
                  style={{
                    width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="mb-4 block text-xl font-medium">
                {questions[currentQuestionIndex]}
              </label>
              <input
                type="text"
                value={answers[currentQuestionIndex] || ''}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[currentQuestionIndex] = e.target.value;
                  setAnswers(newAnswers);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNextQuestion();
                  }
                }}
                placeholder="Type your answer..."
                className="w-full border-b-2 border-zinc-300 bg-transparent py-3 text-lg outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                className="text-sm text-zinc-600 transition-opacity hover:text-zinc-900 disabled:opacity-30 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextQuestion}
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
              >
                {currentQuestionIndex === questions.length - 1
                  ? 'Start Research →'
                  : 'Next →'}
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-8 text-center">
            <p className="mb-2 text-lg font-medium">Querying 4 AI models in parallel...</p>
            <p className="text-sm text-zinc-500">
              This may take 1-2 minutes. We're gathering comprehensive insights from Claude Sonnet 4.5, GPT-5, Gemini 2.5 Pro, and Grok 4 Fast.
            </p>
          </div>
        )}

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
            responses.map((response, index) => {
              const isExpanded = expandedCards.has(index);
              return (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
                >
                  <h3 className="mb-4 text-lg font-semibold">{response.name}</h3>
                  {response.error ? (
                    <p className="text-sm text-red-500">{response.error}</p>
                  ) : (
                    <>
                      <div
                        className={`prose prose-sm prose-zinc dark:prose-invert max-w-none ${
                          !isExpanded ? 'max-h-48 overflow-y-auto' : ''
                        }`}
                      >
                        <ReactMarkdown>{response.text || ''}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => toggleCard(index)}
                        className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {isExpanded ? '▲ Show less' : '▼ Show more'}
                      </button>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Synthesis Section - only show after models have responded */}
        {responses.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Synthesized Research</h2>
            {!synthesis ? (
              <div className="rounded-lg border-2 border-zinc-200 p-8 dark:border-zinc-800">
                <div className="space-y-3">
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border-2 border-zinc-200 p-8 dark:border-zinc-800">
                <div
                  className={`prose prose-zinc dark:prose-invert max-w-none ${
                    !synthesisExpanded ? 'max-h-64 overflow-y-auto' : ''
                  }`}
                >
                  <ReactMarkdown>{synthesis || ''}</ReactMarkdown>
                </div>
                <button
                  onClick={() => setSynthesisExpanded(!synthesisExpanded)}
                  className="mt-4 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {synthesisExpanded ? '▲ Show less' : '▼ Show more'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
