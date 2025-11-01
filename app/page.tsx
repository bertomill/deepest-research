'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { PixelatedCanvas } from '@/components/ui/pixelated-canvas';
import { supabase } from '@/lib/supabase';

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

// Provider logos and colors
const PROVIDER_STYLES: Record<string, { logo: string; bg: string }> = {
  'Anthropic': { logo: '/logos/anthropic-logo.png', bg: '#FFF5F2' },
  'OpenAI': { logo: 'https://logo.clearbit.com/openai.com', bg: '#F0FFF4' },
  'Google': { logo: '/logos/google-logo.png', bg: '#F0F7FF' },
  'xAI': { logo: '/logos/xai-logo.png', bg: '#F5F5F5' },
  'DeepSeek': { logo: '/logos/deepseek-logo.png', bg: '#F0F1FF' },
  'Meta': { logo: '/logos/meta-logo.png', bg: '#F0F7FF' },
};

// Available models from Vercel AI Gateway
const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/o1', name: 'O1', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'xai/grok-4-fast-reasoning', name: 'Grok 4 Fast', provider: 'xAI' },
  { id: 'xai/grok-4-reasoning', name: 'Grok 4 Reasoning', provider: 'xAI' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'meta/llama-4-405b', name: 'Llama 4 405B', provider: 'Meta' },
];

const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-5',
  'google/gemini-2.5-pro',
  'xai/grok-4-fast-reasoning',
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
  const [showGlobe, setShowGlobe] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationNews, setLocationNews] = useState<NewsArticle[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  // Idea generation state
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  // Personalization state
  const [showPersonalize, setShowPersonalize] = useState(false);
  const [userLocation, setUserLocation] = useState('');
  const [userJobTitle, setUserJobTitle] = useState('');
  const [userIndustry, setUserIndustry] = useState('');

  // Audio notification state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<string>('chord');
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);

  // Model selection state
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_MODELS);
  const [showBench, setShowBench] = useState(false);
  const [draggedModel, setDraggedModel] = useState<string | null>(null);
  const [draggedFromTeam, setDraggedFromTeam] = useState(false);

  // Ref for textarea auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth and save state
  const [showSignup, setShowSignup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('audioNotificationsEnabled');
    const savedSound = localStorage.getItem('notificationSound');
    const savedModels = localStorage.getItem('selectedModels');
    const savedLocation = localStorage.getItem('userLocation');
    const savedJobTitle = localStorage.getItem('userJobTitle');
    const savedIndustry = localStorage.getItem('userIndustry');

    if (savedEnabled !== null) {
      setAudioEnabled(savedEnabled === 'true');
    }
    if (savedSound !== null) {
      setSelectedSound(savedSound);
    }
    if (savedModels !== null) {
      try {
        setSelectedModels(JSON.parse(savedModels));
      } catch {
        setSelectedModels(DEFAULT_MODELS);
      }
    }
    if (savedLocation) setUserLocation(savedLocation);
    if (savedJobTitle) setUserJobTitle(savedJobTitle);
    if (savedIndustry) setUserIndustry(savedIndustry);

    // Check if user is authenticated with Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        setUserName(session.user.user_metadata?.name || '');
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUserEmail(session.user.email || '');
        setUserName(session.user.user_metadata?.name || '');
      } else {
        setIsAuthenticated(false);
        setUserEmail('');
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showSoundDropdown && !target.closest('.sound-dropdown-container')) {
        setShowSoundDropdown(false);
      }
      if (showPersonalize && !target.closest('.personalize-dropdown-container')) {
        setShowPersonalize(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSoundDropdown, showPersonalize]);

  // Auto-resize textarea when query changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 192) + 'px';
    }
  }, [query]);

  // Different notification sounds
  const playNotificationSound = (soundType?: string) => {
    const sound = soundType || selectedSound;
    if (!audioEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = audioContext.createGain();
      gainNode.connect(audioContext.destination);

      if (sound === 'chord') {
        // C major chord
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        frequencies.forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          oscillator.connect(gainNode);
          oscillator.start(audioContext.currentTime + i * 0.1);
          oscillator.stop(audioContext.currentTime + 0.5);
        });
      } else if (sound === 'bell') {
        // Bell sound
        gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        [880, 1046.5].forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          oscillator.connect(gainNode);
          oscillator.start(audioContext.currentTime + i * 0.05);
          oscillator.stop(audioContext.currentTime + 0.8);
        });
      } else if (sound === 'ping') {
        // Simple ping
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (sound === 'success') {
        // Success sound (ascending notes)
        gainNode.gain.setValueAtTime(0.12, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const oscillator = audioContext.createOscillator();
          oscillator.frequency.value = freq;
          oscillator.type = 'sine';
          oscillator.connect(gainNode);
          oscillator.start(audioContext.currentTime + i * 0.08);
          oscillator.stop(audioContext.currentTime + i * 0.08 + 0.2);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  // Toggle audio notifications and save to localStorage
  const toggleAudio = () => {
    const newValue = !audioEnabled;
    setAudioEnabled(newValue);
    localStorage.setItem('audioNotificationsEnabled', String(newValue));
  };

  // Change notification sound
  const changeSound = (sound: string) => {
    setSelectedSound(sound);
    localStorage.setItem('notificationSound', sound);
    playNotificationSound(sound);
    setShowSoundDropdown(false);
  };

  // Save personalization data
  const savePersonalization = () => {
    localStorage.setItem('userLocation', userLocation);
    localStorage.setItem('userJobTitle', userJobTitle);
    localStorage.setItem('userIndustry', userIndustry);
    setShowPersonalize(false);
  };

  // Handle save to collection
  const handleSaveToCollection = async () => {
    if (!isAuthenticated) {
      setShowSignup(true);
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('Please sign in to save research');
        setShowSignup(true);
        return;
      }

      // Save to Supabase database
      const { error } = await supabase.from('saved_research').insert({
        user_id: user.id,
        query,
        responses: responses.map(r => ({
          name: r.name,
          text: r.text,
          error: r.error,
        })),
        synthesis,
      });

      if (error) {
        console.error('Save error:', error);
        alert('Failed to save research. Please try again.');
        return;
      }

      alert('Research saved to your collection!');
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save research. Please try again.');
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (!userName || !userEmail) {
      alert('Please fill in all fields');
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: Math.random().toString(36).slice(-8) + 'A1!', // Generate random password
        options: {
          data: {
            name: userName,
          },
        },
      });

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        setIsAuthenticated(true);
        setShowSignup(false);

        // After signup, save the research
        await handleSaveToCollection();
        alert('Account created! Check your email to verify your account.');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (modelId: string, fromTeam: boolean) => {
    setDraggedModel(modelId);
    setDraggedFromTeam(fromTeam);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTeam = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    if (!draggedModel) return;

    if (draggedFromTeam) {
      // Reordering within team
      if (targetIndex !== undefined) {
        const currentIndex = selectedModels.indexOf(draggedModel);
        if (currentIndex !== -1) {
          const newModels = [...selectedModels];
          newModels.splice(currentIndex, 1);
          newModels.splice(targetIndex, 0, draggedModel);
          setSelectedModels(newModels);
          localStorage.setItem('selectedModels', JSON.stringify(newModels));
        }
      }
    } else {
      // Adding from bench
      if (!selectedModels.includes(draggedModel)) {
        if (targetIndex !== undefined) {
          // Insert at specific index
          const newModels = [...selectedModels];
          newModels.splice(targetIndex, 0, draggedModel);
          setSelectedModels(newModels);
          localStorage.setItem('selectedModels', JSON.stringify(newModels));
        } else {
          // Add to end
          const newModels = [...selectedModels, draggedModel];
          setSelectedModels(newModels);
          localStorage.setItem('selectedModels', JSON.stringify(newModels));
        }
      }
    }

    setDraggedModel(null);
    setDraggedFromTeam(false);
  };

  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedModel || !draggedFromTeam) return;

    // Remove from team
    const newModels = selectedModels.filter(id => id !== draggedModel);
    setSelectedModels(newModels);
    localStorage.setItem('selectedModels', JSON.stringify(newModels));

    setDraggedModel(null);
    setDraggedFromTeam(false);
  };

  // Remove model from team
  const removeModel = (modelId: string) => {
    const newModels = selectedModels.filter(id => id !== modelId);
    setSelectedModels(newModels);
    localStorage.setItem('selectedModels', JSON.stringify(newModels));
  };

  // Get model info by ID
  const getModelInfo = (modelId: string) => {
    return AVAILABLE_MODELS.find(m => m.id === modelId) || { id: modelId, name: modelId, provider: 'Unknown' };
  };

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
    setGeneratedIdeas([]);
  };

  const handleGenerateIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: userLocation,
          jobTitle: userJobTitle,
          industry: userIndustry,
        }),
      });

      const data = await res.json();
      setGeneratedIdeas(data.ideas || []);
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setLoadingIdeas(false);
    }
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

    // Initialize empty responses based on selected models
    const initialResponses: ModelResponse[] = selectedModels.map(modelId => ({
      name: getModelInfo(modelId).name,
      text: '',
      error: null,
    }));
    setResponses(initialResponses);
    setSynthesis('');

    // Build enriched prompt with Q&A context
    const enrichedPrompt = `${query}

Additional context from user:
${questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided'}`).join('\n\n')}`;

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enrichedPrompt,
          models: selectedModels,
        }),
      });

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          const eventMatch = line.match(/^event: (.+)\ndata: (.+)$/);
          if (!eventMatch) continue;

          const [, event, dataStr] = eventMatch;
          const data = JSON.parse(dataStr);

          if (event === 'model-chunk') {
            setResponses(prev => {
              const index = prev.findIndex(r => r.name === data.name);
              if (index === -1) return prev;
              const newResponses = [...prev];
              newResponses[index] = {
                ...newResponses[index],
                text: (newResponses[index].text || '') + data.chunk,
              };
              return newResponses;
            });
          } else if (event === 'model-complete') {
            setResponses(prev => {
              const index = prev.findIndex(r => r.name === data.name);
              if (index === -1) return prev;
              const newResponses = [...prev];
              newResponses[index] = {
                name: data.name,
                text: data.text,
                error: data.error,
              };
              return newResponses;
            });
          } else if (event === 'synthesis-chunk') {
            setSynthesis(prev => (prev || '') + data.chunk);
          } else if (event === 'synthesis-complete') {
            if (data.text) setSynthesis(data.text);
          } else if (event === 'done') {
            // Play notification sound when research is complete
            playNotificationSound();
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-7xl">
        {/* Audio notification dropdown - top right corner */}
        <div className="fixed top-4 right-4 z-50">
          <div className="sound-dropdown-container relative">
            <button
              onClick={() => setShowSoundDropdown(!showSoundDropdown)}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-md transition-colors hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              title="Audio notification settings"
            >
              {audioEnabled ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <span className="hidden sm:inline">Sound</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                  <span className="hidden sm:inline">Muted</span>
                </>
              )}
              <svg className={`h-4 w-4 transition-transform ${showSoundDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menu */}
            {showSoundDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                <div className="p-2">
                  <div className="mb-2 px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Notification Sound
                  </div>

                  {/* Sound options */}
                  {[
                    { id: 'chord', label: 'Chord', desc: 'Harmonic blend' },
                    { id: 'bell', label: 'Bell', desc: 'Double chime' },
                    { id: 'ping', label: 'Ping', desc: 'Quick beep' },
                    { id: 'success', label: 'Success', desc: 'Ascending notes' },
                  ].map((sound) => (
                    <button
                      key={sound.id}
                      onClick={() => changeSound(sound.id)}
                      className={`w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                        selectedSound === sound.id && audioEnabled
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{sound.label}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{sound.desc}</div>
                        </div>
                        {selectedSound === sound.id && audioEnabled && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}

                  <div className="my-2 border-t border-zinc-200 dark:border-zinc-700"></div>

                  {/* Mute option */}
                  <button
                    onClick={toggleAudio}
                    className="w-full rounded px-2 py-2 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <span className={audioEnabled ? 'text-zinc-700 dark:text-zinc-300' : 'font-medium text-red-600 dark:text-red-400'}>
                        {audioEnabled ? 'Mute notifications' : 'Unmute notifications'}
                      </span>
                      {!audioEnabled && (
                        <svg className="h-4 w-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <form onSubmit={handleInitialSubmit}>
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleInitialSubmit(e as any);
                }
              }}
              placeholder="What would you like to research?"
              className="w-full resize-none overflow-hidden border-b-2 border-zinc-300 bg-transparent py-3 text-2xl outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100"
              disabled={loading || loadingQuestions}
              rows={1}
              style={{
                minHeight: '3.5rem',
                maxHeight: '12rem',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 192) + 'px';
              }}
            />
          </form>
          {!loading && !loadingQuestions && !showQuestions && !responses.length && !query.trim() && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setShowGlobe(!showGlobe)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
              >
                {showGlobe ? '🌍 Hide Globe' : '🌍 Explore Globe'}
              </button>
              <button
                onClick={handleGenerateIdeas}
                disabled={loadingIdeas}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
              >
                {loadingIdeas ? '💡 Generating...' : '💡 Generate Ideas'}
              </button>
              <div className="personalize-dropdown-container">
                <button
                  onClick={() => setShowPersonalize(!showPersonalize)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
                >
                  👤 Personalize
                </button>
              </div>
            </div>
          )}

          {/* Personalization chips */}
          {!loading && !loadingQuestions && !showQuestions && !responses.length && (userLocation || userJobTitle || userIndustry) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {userLocation && (
                <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{userLocation}</span>
                  <button
                    onClick={() => {
                      setUserLocation('');
                      localStorage.removeItem('userLocation');
                    }}
                    className="ml-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {userJobTitle && (
                <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 dark:bg-purple-950/30 dark:text-purple-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{userJobTitle}</span>
                  <button
                    onClick={() => {
                      setUserJobTitle('');
                      localStorage.removeItem('userJobTitle');
                    }}
                    className="ml-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {userIndustry && (
                <div className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 dark:bg-green-950/30 dark:text-green-300">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{userIndustry}</span>
                  <button
                    onClick={() => {
                      setUserIndustry('');
                      localStorage.removeItem('userIndustry');
                    }}
                    className="ml-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Generated ideas */}
        {generatedIdeas.length > 0 && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-12">
            <h3 className="mb-4 text-xl font-semibold">Research Ideas</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {generatedIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(idea)}
                  className="rounded-lg border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
                >
                  <p className="text-sm font-medium">{idea}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Globe and location suggestions */}
        {showGlobe && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-12">
            <InteractiveGlobe onLocationSelect={handleLocationSelect} />

            {loadingLocation && (
              <div className="mt-8">
                <div className="mx-auto max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="mb-4 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"></div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500"></div>
                      <span className="text-zinc-600 dark:text-zinc-400">Fetching news headlines...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-purple-500" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-zinc-600 dark:text-zinc-400">Searching web for current trends...</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" style={{ animationDelay: '0.4s' }}></div>
                      <span className="text-zinc-600 dark:text-zinc-400">Generating research topics...</span>
                    </div>
                  </div>
                  <p className="mt-4 text-center text-xs text-zinc-500">
                    This may take 10-20 seconds
                  </p>
                </div>
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
          <div className="mb-12 flex flex-col items-center justify-center gap-4">
            <PixelatedCanvas
              src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&h=300&fit=crop"
              width={300}
              height={200}
              cellSize={4}
              dotScale={0.85}
              shape="square"
              backgroundColor="transparent"
              dropoutStrength={0.3}
              interactive={true}
              distortionStrength={5}
              distortionRadius={100}
              distortionMode="swirl"
              followSpeed={0.15}
              jitterStrength={6}
              jitterSpeed={3}
              sampleAverage={true}
              tintColor="#10b981"
              tintStrength={0.3}
              className="rounded-lg"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Generating clarifying questions...
            </p>
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
            <p className="mb-2 text-lg font-medium">Querying {selectedModels.length} AI models in parallel...</p>
            <p className="text-sm text-zinc-500">
              This may take 1-2 minutes. We&apos;re gathering comprehensive insights from {selectedModels.map(id => getModelInfo(id).name).join(', ')}.
            </p>
          </div>
        )}

        {/* Model selector - show when not loading/questioning */}
        {!loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className={`mb-8 relative transition-all ${showBench ? 'mr-80' : ''}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Research Team</h3>
              <button
                onClick={() => setShowBench(!showBench)}
                className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                {showBench ? 'Hide Bench' : 'Show Bench'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
              {selectedModels.map((modelId, index) => {
                const modelInfo = getModelInfo(modelId);
                return (
                  <div
                    key={index}
                    draggable={showBench}
                    onDragStart={() => handleDragStart(modelId, true)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnTeam(e, index)}
                    className="relative rounded-lg"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                    />
                    <div
                      className={`group relative rounded-lg border p-2 text-left transition-colors ${
                        showBench
                          ? 'cursor-move border-zinc-300 hover:border-blue-500 dark:border-zinc-700 dark:hover:border-blue-500'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModel(modelId);
                        }}
                        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        title="Remove from team"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>

                      <div className="flex items-start gap-2">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                          style={{
                            backgroundColor: PROVIDER_STYLES[modelInfo.provider]?.bg || '#F5F5F5',
                          }}
                        >
                          <img
                            src={PROVIDER_STYLES[modelInfo.provider]?.logo || ''}
                            alt={modelInfo.provider}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{modelInfo.provider}</div>
                          <div className="text-xs font-medium truncate">{modelInfo.name}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Drop zone to add new models */}
              {showBench && (
                <div
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnTeam(e)}
                  className="flex items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:border-blue-600 dark:hover:bg-blue-950/40"
                  style={{ minHeight: '80px' }}
                >
                  <div className="text-center">
                    <div className="text-3xl text-blue-500 dark:text-blue-400">+</div>
                    <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">Drag here to add</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bench Sidebar */}
            {showBench && (
              <div className="fixed right-0 top-0 z-50 h-screen w-80 border-l border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bench</h3>
                  <button
                    onClick={() => setShowBench(false)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                  Drag models to your team or drag team members here to bench them
                </p>
                <div
                  className="space-y-2 overflow-y-auto"
                  style={{ maxHeight: 'calc(100vh - 200px)' }}
                  onDragOver={handleDragOver}
                  onDrop={handleDropOnBench}
                >
                  {AVAILABLE_MODELS.filter(model => !selectedModels.includes(model.id)).map((model) => (
                    <div
                      key={model.id}
                      draggable
                      onDragStart={() => handleDragStart(model.id, false)}
                      className="cursor-move rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                          style={{
                            backgroundColor: PROVIDER_STYLES[model.provider]?.bg || '#F5F5F5',
                          }}
                        >
                          <img
                            src={PROVIDER_STYLES[model.provider]?.logo || ''}
                            alt={model.provider}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{model.name}</div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{model.provider}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4">
          {loading ? (
            // Loading skeletons
            selectedModels.map((modelId) => {
              const modelInfo = getModelInfo(modelId);
              return (
                <div
                  key={modelId}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: PROVIDER_STYLES[modelInfo.provider]?.bg || '#F5F5F5',
                      }}
                    >
                      <img
                        src={PROVIDER_STYLES[modelInfo.provider]?.logo || ''}
                        alt={modelInfo.provider}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">{modelInfo.name}</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{modelInfo.provider}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                  </div>
                </div>
              );
            })
          ) : (
            // Actual responses
            responses.map((response, index) => {
              const isExpanded = expandedCards.has(index);
              const modelInfo = getModelInfo(selectedModels[index]);
              return (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: PROVIDER_STYLES[modelInfo.provider]?.bg || '#F5F5F5',
                      }}
                    >
                      <img
                        src={PROVIDER_STYLES[modelInfo.provider]?.logo || ''}
                        alt={modelInfo.provider}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">{response.name}</h3>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{modelInfo.provider}</p>
                    </div>
                  </div>
                  {response.error ? (
                    <p className="text-xs text-red-500">{response.error}</p>
                  ) : (
                    <>
                      <div
                        className={`prose prose-xs prose-zinc dark:prose-invert max-w-none ${
                          !isExpanded ? 'max-h-32 overflow-y-auto' : ''
                        }`}
                      >
                        <ReactMarkdown>{response.text || ''}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => toggleCard(index)}
                        className="mt-2 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
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

        {/* Synthesis Section - only show after loading completes and synthesis exists */}
        {!loading && synthesis && (
          <div className="mt-12">
            <h2 className="mb-6 text-2xl font-bold">Synthesized Research</h2>
            <div className="rounded-lg border-2 border-zinc-200 p-8 dark:border-zinc-800">
              <div
                className={`prose prose-zinc dark:prose-invert max-w-none ${
                  !synthesisExpanded ? 'max-h-64 overflow-y-auto' : ''
                }`}
              >
                <ReactMarkdown>{synthesis}</ReactMarkdown>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <button
                  onClick={() => setSynthesisExpanded(!synthesisExpanded)}
                  className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {synthesisExpanded ? '▲ Show less' : '▼ Show more'}
                </button>
                <button
                  onClick={handleSaveToCollection}
                  className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save to Collection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Personalize Modal - Mobile Optimized */}
        {showPersonalize && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowPersonalize(false)}
            />

            {/* Modal - Bottom sheet on mobile, centered on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="personalize-dropdown-container w-full rounded-t-2xl bg-white p-6 shadow-2xl transition-transform md:w-auto md:min-w-[400px] md:rounded-2xl dark:bg-zinc-900">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Personalize Your Experience</h3>
                  <button
                    onClick={() => setShowPersonalize(false)}
                    className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Location
                    </label>
                    <input
                      type="text"
                      value={userLocation}
                      onChange={(e) => setUserLocation(e.target.value)}
                      placeholder="e.g., San Francisco, CA"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={userJobTitle}
                      onChange={(e) => setUserJobTitle(e.target.value)}
                      placeholder="e.g., Strategy Consultant"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Industry
                    </label>
                    <input
                      type="text"
                      value={userIndustry}
                      onChange={(e) => setUserIndustry(e.target.value)}
                      placeholder="e.g., Technology"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <button
                    onClick={savePersonalization}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Signup Modal - Mobile Optimized */}
        {showSignup && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowSignup(false)}
            />

            {/* Modal - Bottom sheet on mobile, centered on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="w-full rounded-t-2xl bg-white p-6 shadow-2xl transition-transform md:w-auto md:min-w-[400px] md:rounded-2xl dark:bg-zinc-900">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Save to Collection</h3>
                  <button
                    onClick={() => setShowSignup(false)}
                    className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                  Create an account to save your research to your personal collection
                </p>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <button
                    onClick={handleSignup}
                    className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Create Account & Save
                  </button>

                  <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
