"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { ShootingStars } from "@/components/ui/shooting-stars";
import { StarsBackground } from "@/components/ui/stars-background";

export const dynamic = 'force-dynamic';

interface CustomResearcher {
  id: string;
  name: string;
  background: string;
  skills: string[];
  opinions: string[];
  tools: string[];
  process: string;
  icon: string;
  created_at: string;
}

const AVAILABLE_TOOLS = [
  { id: 'web_search', name: 'Web Search', icon: '🔍' },
  { id: 'code_interpreter', name: 'Code Interpreter', icon: '💻' },
  { id: 'weather', name: 'Weather', icon: '🌤️' },
  { id: 'calculator', name: 'Calculator', icon: '🔢' },
  { id: 'image_generation', name: 'Image Generation', icon: '🎨' },
  { id: 'file_reader', name: 'File Reader', icon: '📄' },
];

const RESEARCHER_ICONS = [
  '🤖', '🧠', '🔬', '📊', '💡', '🎯',
  '🚀', '⚡', '🌟', '🔥', '💎', '🎓',
  '📚', '🧪', '🔭', '🎨', '🎭', '🎪',
  '🦉', '🦊', '🐉', '🦄', '🌈', '☀️',
];

// Provider logos and colors
const PROVIDER_STYLES: Record<string, { logo: string; bg: string }> = {
  'Anthropic': { logo: '/logos/anthropic-logo.png', bg: '#FFF5F2' },
  'OpenAI': { logo: 'https://logo.clearbit.com/openai.com', bg: '#F0FFF4' },
  'Google': { logo: '/logos/google-logo.png', bg: '#F0F7FF' },
  'xAI': { logo: '/logos/grok-logo.png', bg: '#F5F5F5' },
  'DeepSeek': { logo: '/logos/deepseek-logo.png', bg: '#F0F1FF' },
  'Meta': { logo: '/logos/meta-logo.png', bg: '#F0F7FF' },
};

const DEFAULT_MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/o1', name: 'O1', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'xai/grok-4', name: 'Grok 4', provider: 'xAI' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'meta/llama-4-405b', name: 'Llama 4 405B', provider: 'Meta' },
];

export default function ResearchTeamPage() {
  const [customResearchers, setCustomResearchers] = useState<CustomResearcher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [opinions, setOpinions] = useState<string[]>([]);
  const [newOpinion, setNewOpinion] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [process, setProcess] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🤖');

  useEffect(() => {
    loadResearchers();
  }, []);

  const loadResearchers = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/";
        return;
      }

      setIsAuthenticated(true);
      setUserEmail(user.email || '');

      // Load custom researchers from Supabase
      const { data, error } = await supabase
        .from('custom_researchers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading researchers:', error);
      } else if (data) {
        setCustomResearchers(data);
      }
    } catch (error) {
      console.error('Error loading researchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const createResearcher = async () => {
    if (!name.trim()) {
      alert('Please enter a name for your researcher');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_researchers')
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            background: background.trim(),
            skills,
            opinions,
            tools: selectedTools,
            process: process.trim(),
            icon: selectedIcon,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating researcher:', error);
        alert('Failed to create researcher. Please try again.');
        return;
      }

      if (data) {
        setCustomResearchers([data, ...customResearchers]);
      }

      // Reset form
      setName('');
      setBackground('');
      setSkills([]);
      setOpinions([]);
      setSelectedTools([]);
      setProcess('');
      setSelectedIcon('🤖');
      setCurrentStep(0);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating researcher:', error);
      alert('Failed to create researcher. Please try again.');
    }
  };

  const deleteResearcher = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_researchers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting researcher:', error);
        alert('Failed to delete researcher. Please try again.');
        return;
      }

      const updated = customResearchers.filter(r => r.id !== id);
      setCustomResearchers(updated);
    } catch (error) {
      console.error('Error deleting researcher:', error);
      alert('Failed to delete researcher. Please try again.');
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const addOpinion = () => {
    if (newOpinion.trim() && !opinions.includes(newOpinion.trim())) {
      setOpinions([...opinions, newOpinion.trim()]);
      setNewOpinion('');
    }
  };

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter(t => t !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return true; // Background is optional
      case 2:
        return true; // Skills are optional
      case 3:
        return true; // Tools are optional
      case 4:
        return true; // Icon selection
      case 5:
        return true; // Opinions/process are optional
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-black">
      <ShootingStars className="absolute inset-0 z-0" />
      <StarsBackground className="absolute inset-0 z-0" />

      <div className="relative z-10">
        <nav className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-fit -translate-x-1/2">
          <div className="flex items-center justify-between gap-3 whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-3 font-[family-name:var(--font-inter)] shadow-lg backdrop-blur-md md:gap-6 md:px-6">
            {/* Logo/Brand */}
            <a href="/" className="flex items-center gap-2">
              <span className="text-base font-bold text-zinc-100 md:text-xl">Deepest Research</span>
            </a>

            {/* Desktop Menu - Hidden on mobile */}
            <div className="hidden items-center gap-3 md:flex">
              {isAuthenticated && (
                <>
                  <a
                    href="/research-team"
                    className="rounded-full px-4 py-2 text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-800"
                  >
                    Research Team
                  </a>
                  <a
                    href="/collection"
                    className="rounded-full px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
                  >
                    My Collection
                  </a>
                </>
              )}

              {/* User menu */}
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-zinc-400">{userEmail}</span>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                    className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => window.location.href = "/"}
                  className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                  Sign in
                </button>
              )}
            </div>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center rounded-full p-2 text-zinc-100 transition-colors hover:bg-zinc-800 md:hidden"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 top-16 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />

            {/* Menu Panel */}
            <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 md:hidden">
              <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                {/* Navigation Links */}
                <a
                  href="/"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Home
                </a>
                <a
                  href="/research-team"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Research Team
                </a>
                <a
                  href="/collection"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  My Collection
                </a>

                {/* User section */}
                {isAuthenticated && (
                  <>
                    <div className="flex items-center gap-3 px-8 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {userEmail}
                    </div>
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      className="flex items-center gap-3 px-8 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Research Team
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Manage your AI researchers and create custom research agents
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="rounded-full border border-zinc-700/50 bg-linear-to-br from-blue-500/10 to-zinc-800/80 px-6 py-3 text-sm font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-blue-500/20"
            >
              + Create Researcher
            </button>
          </div>

          {/* Default Models */}
          <div className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Default AI Models
            </h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {DEFAULT_MODELS.map((model) => {
                  const providerStyle = PROVIDER_STYLES[model.provider];
                  return (
                    <div
                      key={model.id}
                      className="group relative shrink-0 w-64 rounded-2xl border border-zinc-700/50 bg-linear-to-br from-zinc-800/80 to-zinc-900/80 p-5 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-zinc-800/90 hover:to-zinc-900/90 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform group-hover:scale-105"
                          style={{
                            backgroundColor: providerStyle?.bg || '#F5F5F5',
                          }}
                        >
                          {providerStyle?.logo ? (
                            <img
                              src={providerStyle.logo}
                              alt={model.provider}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-semibold text-zinc-600">
                              {model.provider.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-zinc-100 mb-1">{model.name}</h3>
                          <p className="text-sm text-zinc-400">{model.provider}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Custom Researchers */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Custom Researchers
            </h2>
            {customResearchers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-12 text-center">
                <p className="mb-4 text-zinc-500">No custom researchers yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-sm font-medium text-blue-400 hover:text-blue-300"
                >
                  Create your first researcher →
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {customResearchers.map((researcher) => (
                  <div
                    key={researcher.id}
                    className="rounded-2xl border border-zinc-700/50 bg-linear-to-br from-zinc-800/80 to-zinc-900/80 p-6 backdrop-blur-md"
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-zinc-100">{researcher.name}</h3>
                        {researcher.background && (
                          <p className="mt-1 text-sm text-zinc-400">{researcher.background}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteResearcher(researcher.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>

                    {researcher.skills.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-zinc-500">SKILLS:</p>
                        <div className="flex flex-wrap gap-1">
                          {researcher.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {researcher.tools.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-zinc-500">TOOLS:</p>
                        <div className="flex flex-wrap gap-1">
                          {researcher.tools.map((toolId) => {
                            const tool = AVAILABLE_TOOLS.find(t => t.id === toolId);
                            return tool ? (
                              <span
                                key={toolId}
                                className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300"
                              >
                                {tool.icon} {tool.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}

                    {researcher.opinions.length > 0 && (
                      <div className="mb-3">
                        <p className="mb-1 text-xs font-medium text-zinc-500">OPINIONS:</p>
                        <div className="space-y-1">
                          {researcher.opinions.map((opinion, i) => (
                            <p key={i} className="text-xs text-zinc-400">• {opinion}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {researcher.process && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-zinc-500">PROCESS:</p>
                        <p className="text-xs text-zinc-400">{researcher.process}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Researcher Modal - Typeform Style */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <div className="relative w-full max-w-4xl px-8 py-16 md:px-16">
            {/* Close button */}
            <button
              onClick={() => {
                setShowCreateModal(false);
                setCurrentStep(0);
              }}
              className="absolute right-8 top-8 text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Progress indicator */}
            <div className="mb-16 flex items-center justify-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-1 w-14 rounded-full transition-all duration-300 ${
                    step <= currentStep ? 'bg-zinc-100' : 'bg-zinc-800'
                  }`}
                />
              ))}
            </div>

            {/* Step 0: Name */}
            {currentStep === 0 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 1 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  What's the name of your researcher?
                </h2>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && canProceed()) {
                      nextStep();
                    }
                  }}
                  placeholder="e.g., Dr. Sarah Chen"
                  className="w-full border-b-2 border-zinc-800 bg-transparent py-4 text-2xl text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-100"
                  autoFocus
                />
                <div className="mt-8 text-sm text-zinc-600">Press Enter ↵</div>
              </div>
            )}

            {/* Step 1: Background */}
            {currentStep === 1 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 2 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  What's their background?
                </h2>
                <textarea
                  value={background}
                  onChange={(e) => setBackground(e.target.value)}
                  placeholder="e.g., PhD in Computer Science with 15 years of AI research experience"
                  rows={3}
                  className="w-full resize-none border-b-2 border-zinc-800 bg-transparent py-4 text-xl text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-100"
                  autoFocus
                />
                <div className="mt-6 text-sm text-zinc-600">Optional - Press Enter to skip ↵</div>
              </div>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 3 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  What special skills do they have?
                </h2>
                <div className="mb-6 flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newSkill.trim()) {
                          addSkill();
                        }
                      }
                    }}
                    placeholder="e.g., Data Analysis"
                    className="flex-1 border-b-2 border-zinc-800 bg-transparent py-3 text-xl text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-100"
                    autoFocus
                  />
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-lg text-zinc-300"
                      >
                        {skill}
                        <button
                          onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
                          className="text-zinc-500 transition-colors hover:text-zinc-300"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-8 text-sm text-zinc-600">Press Enter to add, then Continue when done</div>
              </div>
            )}

            {/* Step 3: Tools */}
            {currentStep === 3 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 4 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  Which tools can they use?
                </h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {AVAILABLE_TOOLS.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={`rounded-2xl border px-6 py-5 text-left transition-all ${
                        selectedTools.includes(tool.id)
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                      }`}
                    >
                      <div className="mb-2 text-2xl">{tool.icon}</div>
                      <div className="text-base font-medium">{tool.name}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-8 text-sm text-zinc-600">Select all that apply</div>
              </div>
            )}

            {/* Step 4: Icon Selection */}
            {currentStep === 4 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 5 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  Pick an icon for your researcher
                </h2>
                <div className="grid grid-cols-6 gap-3 md:grid-cols-8">
                  {RESEARCHER_ICONS.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`flex aspect-square items-center justify-center rounded-2xl border text-4xl transition-all ${
                        selectedIcon === icon
                          ? 'border-zinc-600 bg-zinc-800 scale-110'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:scale-105'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <div className="mt-8 text-sm text-zinc-600">Choose an icon that represents your researcher</div>
              </div>
            )}

            {/* Step 5: Opinions & Process */}
            {currentStep === 5 && (
              <div className="min-h-[300px] animate-in fade-in duration-500">
                <div className="mb-3 text-sm font-medium text-zinc-500">Question 6 of 6</div>
                <h2 className="mb-12 text-4xl font-bold text-zinc-100 md:text-5xl">
                  Any special opinions or research process?
                </h2>

                <div className="mb-8">
                  <label className="mb-4 block text-lg text-zinc-400">Special Opinions / Biases</label>
                  <div className="mb-4 flex gap-2">
                    <input
                      type="text"
                      value={newOpinion}
                      onChange={(e) => setNewOpinion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newOpinion.trim()) {
                            addOpinion();
                          }
                        }
                      }}
                      placeholder="e.g., Prefers empirical evidence"
                      className="flex-1 border-b-2 border-zinc-800 bg-transparent py-3 text-lg text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-100"
                      autoFocus
                    />
                  </div>
                  {opinions.length > 0 && (
                    <div className="space-y-2">
                      {opinions.map((opinion, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3 text-zinc-300"
                        >
                          <span className="flex-1">{opinion}</span>
                          <button
                            onClick={() => setOpinions(opinions.filter((_, idx) => idx !== i))}
                            className="text-zinc-500 transition-colors hover:text-zinc-300"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-4 block text-lg text-zinc-400">Research Process</label>
                  <textarea
                    value={process}
                    onChange={(e) => setProcess(e.target.value)}
                    placeholder="e.g., 1. Gather data from multiple sources. 2. Cross-reference findings..."
                    rows={4}
                    className="w-full resize-none border-b-2 border-zinc-800 bg-transparent py-3 text-lg text-zinc-100 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-100"
                  />
                </div>
                <div className="mt-6 text-sm text-zinc-600">Both optional</div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-16 flex items-center justify-between">
              {currentStep > 0 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className={`rounded-full px-8 py-3 font-medium transition-all ${
                    canProceed()
                      ? 'bg-zinc-100 text-zinc-900 hover:bg-white'
                      : 'cursor-not-allowed bg-zinc-900 text-zinc-700'
                  }`}
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={createResearcher}
                  className="rounded-full bg-zinc-100 px-8 py-3 font-medium text-zinc-900 transition-all hover:bg-white"
                >
                  Create Researcher
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
