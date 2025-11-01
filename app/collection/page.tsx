'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ReactMarkdown from 'react-markdown';

interface SavedResearch {
  id: string;
  query: string;
  responses: Array<{
    name: string;
    text: string | null;
    error: string | null;
  }>;
  synthesis: string;
  created_at: string;
}

export default function CollectionPage() {
  const [savedResearch, setSavedResearch] = useState<SavedResearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadSavedResearch();
  }, []);

  const loadSavedResearch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/';
        return;
      }

      const { data, error } = await supabase
        .from('saved_research')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSavedResearch(data || []);
    } catch (error) {
      console.error('Error loading saved research:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResearch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this research?')) return;

    try {
      const { error } = await supabase
        .from('saved_research')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedResearch(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting research:', error);
      alert('Failed to delete research');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl pt-20">
          <p className="text-center text-zinc-500">Loading your collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8 dark:bg-zinc-950">
      {/* Navigation Header */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-2">
            <a href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Deepest Research
            </a>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            ← Back to Research
          </a>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl pt-20">
        <h1 className="mb-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">My Collection</h1>

        {savedResearch.length === 0 ? (
          <div className="text-center">
            <p className="mb-4 text-zinc-500">No saved research yet.</p>
            <a
              href="/"
              className="inline-block rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Start Researching
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {savedResearch.map((research) => (
              <div
                key={research.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {research.query}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {new Date(research.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteResearch(research.id)}
                    className="ml-4 rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                    title="Delete"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <button
                  onClick={() => setExpandedId(expandedId === research.id ? null : research.id)}
                  className="mb-4 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {expandedId === research.id ? '▼ Hide details' : '▶ Show details'}
                </button>

                {expandedId === research.id && (
                  <div className="space-y-6">
                    {/* Synthesis */}
                    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-950">
                      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">Synthesized Research</h3>
                      <div className="prose prose-zinc dark:prose-invert max-w-none text-sm">
                        <ReactMarkdown>{research.synthesis}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Individual Model Responses */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {research.responses.map((response, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                        >
                          <h4 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">{response.name}</h4>
                          {response.error ? (
                            <p className="text-sm text-red-600 dark:text-red-400">{response.error}</p>
                          ) : (
                            <div className="prose prose-zinc dark:prose-invert max-w-none text-sm">
                              <ReactMarkdown>{response.text || ''}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
