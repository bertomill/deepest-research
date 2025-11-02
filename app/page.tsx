'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { PixelatedCanvas } from '@/components/ui/pixelated-canvas';
import { Toast } from '@/components/ui/toast';
import JumpingTextInstagram from '@/components/ui/jumping-text-instagram';
import GetStartedButton from '@/components/ui/get-started-button';
import { ShootingStars } from '@/components/ui/shooting-stars';
import { StarsBackground } from '@/components/ui/stars-background';
import { ResearchPipeline } from '@/components/research-pipeline';
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
  'xAI': { logo: '/logos/grok-logo.png', bg: '#F5F5F5' },
  'DeepSeek': { logo: '/logos/deepseek-logo.png', bg: '#F0F1FF' },
  'Meta': { logo: '/logos/meta-logo.png', bg: '#F0F7FF' },
};

// Available models from Vercel AI Gateway
const AVAILABLE_MODELS = [
  { id: 'anthropic/claude-sonnet-4.5', name: 'Claude Sonnet 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic' },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI' },
  { id: 'openai/gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'openai/o3', name: 'O3', provider: 'OpenAI' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google' },
  { id: 'xai/grok-4', name: 'Grok 4', provider: 'xAI' },
  { id: 'xai/grok-4-reasoning', name: 'Grok 4 Reasoning', provider: 'xAI' },
  { id: 'xai/grok-4-fast-reasoning', name: 'Grok 4 Fast Reasoning', provider: 'xAI' },
  { id: 'xai/grok-4-fast-non-reasoning', name: 'Grok 4 Fast Non-Reasoning', provider: 'xAI' },
  { id: 'deepseek/deepseek-v3', name: 'DeepSeek V3', provider: 'DeepSeek' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek' },
  { id: 'meta/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta' },
];

const DEFAULT_MODELS = [
  'anthropic/claude-sonnet-4.5',
  'openai/gpt-5',
  'google/gemini-2.5-pro',
  'xai/grok-4',
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

  // Research Camera state
  const [showResearchCamera, setShowResearchCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Research Planning state
  const [showResearchPlan, setShowResearchPlan] = useState(false);
  const [researchTasks, setResearchTasks] = useState<Array<{
    id: string;
    title: string;
    description: string;
    prompt: string;
  }>>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string[]>>({});
  const [loadingResearchPlan, setLoadingResearchPlan] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showModelPickerForTask, setShowModelPickerForTask] = useState<string | null>(null);

  // Audio notification state
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<string>('chord');
  const [showSoundDropdown, setShowSoundDropdown] = useState(false);

  // Toast notification state
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Prompt preview state
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [editablePrompt, setEditablePrompt] = useState('');

  // Model selection state
  const [selectedModels, setSelectedModels] = useState<string[]>(DEFAULT_MODELS);
  const [showBench, setShowBench] = useState(false);
  const [draggedModel, setDraggedModel] = useState<string | null>(null);
  const [draggedFromTeam, setDraggedFromTeam] = useState(false);

  // Mobile menu state
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Ref for textarea auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auth and save state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [authPassword, setAuthPassword] = useState('');

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

  // Helper function to show toast notification
  const showToastNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

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
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
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
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
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
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        const oscillator = audioContext.createOscillator();
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        oscillator.connect(gainNode);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } else if (sound === 'success') {
        // Success sound (ascending notes)
        gainNode.gain.setValueAtTime(0.35, audioContext.currentTime);
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
      setAuthMode('signup');
      setShowAuthModal(true);
      return;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showToastNotification('Please sign in to save research');
        setAuthMode('signin');
        setShowAuthModal(true);
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
        showToastNotification('Failed to save research. Please try again.');
        return;
      }

      showToastNotification('Research saved to your collection!');
    } catch (error) {
      console.error('Save error:', error);
      showToastNotification('Failed to save research. Please try again.');
    }
  };

  // Handle sign in
  const handleSignIn = async () => {
    if (!userEmail || !authPassword) {
      showToastNotification('Please fill in all fields');
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: authPassword,
      });

      if (error) {
        showToastNotification(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthPassword('');
        showToastNotification('Signed in successfully!');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      showToastNotification('Failed to sign in. Please try again.');
    }
  };

  // Handle signup
  const handleSignup = async () => {
    if (!userName || !userEmail || !authPassword) {
      showToastNotification('Please fill in all fields');
      return;
    }

    if (authPassword.length < 6) {
      showToastNotification('Password must be at least 6 characters');
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userEmail,
        password: authPassword,
        options: {
          data: {
            name: userName,
          },
        },
      });

      if (error) {
        showToastNotification(`Error: ${error.message}`);
        return;
      }

      if (data.user) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
        setAuthPassword('');
        showToastNotification('Account created successfully!');
      }
    } catch (error) {
      console.error('Signup error:', error);
      showToastNotification('Failed to create account. Please try again.');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, modelId: string, fromTeam: boolean) => {
    setDraggedModel(modelId);
    setDraggedFromTeam(fromTeam);
    e.dataTransfer.setData('modelId', modelId);
    e.dataTransfer.effectAllowed = 'move';
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
      // Call both APIs in parallel
      const [newsRes, ideasRes] = await Promise.all([
        fetch('/api/location-news', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location }),
        }),
        fetch('/api/location-ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city: location.city,
            country: location.country,
            lat: location.lat,
            lng: location.lng,
          }),
        }),
      ]);

      const newsData = await newsRes.json();
      const ideasData = await ideasRes.json();

      // Combine suggestions from both APIs
      const allSuggestions = [
        ...(ideasData.ideas || []),
        ...(newsData.suggestions || []),
      ];

      setLocationSuggestions(allSuggestions);
      setLocationNews(newsData.news || []);
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

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Generate research plan after Q&A
      setShowQuestions(false);
      setLoadingResearchPlan(true);

      try {
        const response = await fetch('/api/research-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, answers }),
        });

        const data = await response.json();

        if (data.tasks && data.tasks.length > 0) {
          setResearchTasks(data.tasks);
          setShowResearchPlan(true);

          // Auto-assign selected models to tasks evenly
          const assignments: Record<string, string[]> = {};
          const tasksCount = data.tasks.length;

          selectedModels.forEach((modelId, index) => {
            const taskIndex = index % tasksCount;
            const taskId = data.tasks[taskIndex].id;

            if (!assignments[taskId]) {
              assignments[taskId] = [];
            }
            assignments[taskId].push(modelId);
          });

          setTaskAssignments(assignments);

          // Build enriched prompt for later
          const enrichedPrompt = `${query}

Additional context from user:
${questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || 'No answer provided'}`).join('\n\n')}`;
          setEditablePrompt(enrichedPrompt);
        } else {
          throw new Error('No tasks generated');
        }
      } catch (error) {
        console.error('Error generating research plan:', error);
        showToastNotification('Failed to generate research plan. Please try again.');
        setShowQuestions(true);
      } finally {
        setLoadingResearchPlan(false);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleRegeneratePlan = async () => {
    setLoadingResearchPlan(true);
    try {
      const response = await fetch('/api/research-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, answers }),
      });

      const data = await response.json();

      if (data.tasks && data.tasks.length > 0) {
        setResearchTasks(data.tasks);

        // Auto-assign selected models to tasks evenly
        const assignments: Record<string, string[]> = {};
        const tasksCount = data.tasks.length;

        selectedModels.forEach((modelId, index) => {
          const taskIndex = index % tasksCount;
          const taskId = data.tasks[taskIndex].id;

          if (!assignments[taskId]) {
            assignments[taskId] = [];
          }
          assignments[taskId].push(modelId);
        });

        setTaskAssignments(assignments);
        showToastNotification('Research plan regenerated!');
      }
    } catch (error) {
      console.error('Error regenerating research plan:', error);
      showToastNotification('Failed to regenerate plan. Please try again.');
    } finally {
      setLoadingResearchPlan(false);
    }
  };

  const handleApprovePlan = () => {
    // Use the manually assigned models from drag-and-drop
    setShowResearchPlan(false);

    // Start research directly with task-based prompts
    handleStartResearchWithTasks(taskAssignments);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      description: '',
      prompt: newTaskTitle.trim(),
    };

    setResearchTasks([...researchTasks, newTask]);
    setNewTaskTitle('');
  };

  // Camera handlers
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      showToastNotification('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        setShowResearchCamera(false);
        showToastNotification('Photo captured!');
      }
    }
  };

  const removePhoto = () => {
    setCapturedImage(null);
  };

  useEffect(() => {
    if (showResearchCamera && !cameraStream) {
      startCamera();
    } else if (!showResearchCamera && cameraStream) {
      stopCamera();
    }
    return () => {
      if (cameraStream) {
        stopCamera();
      }
    };
  }, [showResearchCamera]);

  const handleStartResearchWithTasks = async (assignments: Record<string, string[]>) => {
    setLoading(true);
    setShowQuestions(false);
    setShowPromptPreview(false);
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

    try {
      const res = await fetch('/api/query-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: researchTasks,
          taskAssignments: assignments,
          originalQuery: query,
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

  const handleStartResearch = async () => {
    setLoading(true);
    setShowQuestions(false);
    setShowPromptPreview(false);
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

    // Use the editable prompt (user may have modified it)
    const enrichedPrompt = editablePrompt;

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
    <div className="relative min-h-screen overflow-hidden p-8 pb-24 pt-16 md:pb-8 md:pt-8">
      {/* Shooting Stars Background */}
      <ShootingStars className="absolute inset-0 z-0" />
      <StarsBackground className="absolute inset-0 z-0" />

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Toast notification */}
        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={() => setShowToast(false)}
        />

      {/* Desktop Floating Navigation */}
      <nav className="fixed left-1/2 top-4 z-50 hidden w-[calc(100%-2rem)] max-w-fit -translate-x-1/2 md:block">
        <div className="flex items-center justify-between gap-3 whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-3 font-[family-name:var(--font-inter)] shadow-lg backdrop-blur-md md:gap-6 md:px-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-100 md:text-xl">Deepest Research</span>
          </div>

          {/* Desktop Menu */}
          <div className="flex items-center gap-3">
            {/* Sound Dropdown */}
            <div className="sound-dropdown-container relative">
              <button
                onClick={() => setShowSoundDropdown(!showSoundDropdown)}
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                title="Audio notification settings"
              >
                {audioEnabled ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              {/* Sound Dropdown menu */}
              {showSoundDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
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

            {/* Collection link - only show if authenticated */}
            {isAuthenticated && (
              <>
                <a
                  href="/research-team"
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Research Team
                </a>
                <a
                  href="/collection"
                  className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  My Collection
                </a>
              </>
            )}

            {/* User menu */}
            {isAuthenticated ? (
              <>
                <span className="text-sm text-zinc-600 dark:text-zinc-400">{userEmail}</span>
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setIsAuthenticated(false);
                    setUserEmail('');
                    setUserName('');
                    showToastNotification('Signed out successfully');
                  }}
                  className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setShowAuthModal(true);
                }}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar - Logo and User Icon */}
      <nav className="fixed left-0 right-0 top-0 z-50 md:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-lg font-bold text-zinc-100">Deepest Research</span>
          {isAuthenticated && (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-base font-medium text-zinc-100">
              {userName ? userName.charAt(0).toUpperCase() : userEmail.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-black/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-center gap-8 px-4 py-3">
          <a
            href="/"
            className="flex flex-col items-center gap-1"
          >
            <svg className="h-8 w-8 text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-xs text-zinc-400">Home</span>
          </a>

          {isAuthenticated && (
            <>
              <a
                href="/research-team"
                className="flex flex-col items-center gap-1"
              >
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs text-zinc-400">Team</span>
              </a>

              <a
                href="/collection"
                className="flex flex-col items-center gap-1"
              >
                <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-xs text-zinc-400">Collection</span>
              </a>
            </>
          )}
        </div>
      </nav>

      {/* Mobile Menu Overlay - Removed, replaced with bottom navigation */}
      {false && showMobileMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-20 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />

          {/* Menu Panel */}
          <div className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900 md:hidden">
              <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                {/* Audio Settings Section */}
                <div className="px-8 py-4">
                  <div className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Audio Settings
                  </div>

                  {/* Sound options */}
                  <div className="space-y-2">
                    {[
                      { id: 'chord', label: 'Chord', desc: 'Harmonic blend' },
                      { id: 'bell', label: 'Bell', desc: 'Double chime' },
                      { id: 'ping', label: 'Ping', desc: 'Quick beep' },
                      { id: 'success', label: 'Success', desc: 'Ascending notes' },
                    ].map((sound) => (
                      <button
                        key={sound.id}
                        onClick={() => {
                          changeSound(sound.id);
                          if (!audioEnabled) {
                            setAudioEnabled(true);
                            localStorage.setItem('audioNotificationsEnabled', 'true');
                          }
                        }}
                        className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                          selectedSound === sound.id && audioEnabled
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-sm font-medium ${
                              selectedSound === sound.id && audioEnabled
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-zinc-900 dark:text-zinc-100'
                            }`}>
                              {sound.label}
                            </div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">{sound.desc}</div>
                          </div>
                          {selectedSound === sound.id && audioEnabled && (
                            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {/* Mute toggle */}
                    <button
                      onClick={toggleAudio}
                      className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                        !audioEnabled ? 'bg-red-50 dark:bg-red-900/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${
                          audioEnabled
                            ? 'text-zinc-900 dark:text-zinc-100'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
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

                {/* Collection link - only show if authenticated */}
                {isAuthenticated && (
                  <>
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
                  </>
                )}

                {/* User section */}
                {isAuthenticated ? (
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
                        setIsAuthenticated(false);
                        setUserEmail('');
                        setUserName('');
                        setShowMobileMenu(false);
                        showToastNotification('Signed out successfully');
                      }}
                      className="flex items-center gap-3 px-8 py-4 text-base font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setAuthMode('signin');
                      setShowAuthModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="flex items-center gap-3 px-8 py-4 text-base font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </>
        )}

      <div className="mx-auto max-w-7xl pt-24">
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
              className="w-full resize-none overflow-hidden border-b-2 border-zinc-700 bg-transparent py-4 text-2xl text-zinc-100 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-100 md:text-3xl"
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

          {/* Get Started button - shows when query has text and before questions start */}
          {!loading && !loadingQuestions && !loadingResearchPlan && !showQuestions && !showResearchPlan && !showPromptPreview && !responses.length && query.trim() && (
            <div className="mt-4 flex justify-center">
              <GetStartedButton
                text="Get started"
                onClick={() => {
                  handleInitialSubmit({ preventDefault: () => {} } as any);
                }}
              />
            </div>
          )}

          {!loading && !loadingQuestions && !showQuestions && !responses.length && !query.trim() && (
            <div className="-mx-8 mt-3 overflow-x-auto px-8 md:mx-0 md:px-0">
              <div className="flex gap-2 md:flex-wrap">
                <button
                  onClick={handleGenerateIdeas}
                  disabled={loadingIdeas}
                  className="whitespace-nowrap rounded-full border border-zinc-700/50 bg-linear-to-br from-purple-500/5 to-zinc-800/80 px-6 py-3.5 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-purple-500/10 disabled:opacity-50"
                >
                  {loadingIdeas ? 'Generating...' : 'Generate Ideas'}
                </button>
                <button
                  onClick={() => setShowResearchCamera(!showResearchCamera)}
                  className="whitespace-nowrap rounded-full border border-zinc-700/50 bg-linear-to-br from-green-500/5 to-zinc-800/80 px-6 py-3.5 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-green-500/10"
                >
                  Research Camera
                </button>
                <div className="personalize-dropdown-container">
                  <button
                    onClick={() => setShowPersonalize(!showPersonalize)}
                    className="whitespace-nowrap rounded-full border border-zinc-700/50 bg-linear-to-br from-orange-500/5 to-zinc-800/80 px-6 py-3.5 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-orange-500/10"
                  >
                    Personalize
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Personalization chips */}
          {!loading && !loadingQuestions && !showQuestions && !responses.length && (userLocation || userJobTitle || userIndustry) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {userLocation && (
                <div className="flex items-center gap-2 rounded-full border border-zinc-700/50 bg-linear-to-br from-blue-500/5 to-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md">
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
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-zinc-700/50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {userJobTitle && (
                <div className="flex items-center gap-2 rounded-full border border-zinc-700/50 bg-linear-to-br from-purple-500/5 to-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{userJobTitle}</span>
                  <button
                    onClick={() => {
                      setUserJobTitle('');
                      localStorage.removeItem('userJobTitle');
                    }}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-zinc-700/50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {userIndustry && (
                <div className="flex items-center gap-2 rounded-full border border-zinc-700/50 bg-linear-to-br from-green-500/5 to-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{userIndustry}</span>
                  <button
                    onClick={() => {
                      setUserIndustry('');
                      localStorage.removeItem('userIndustry');
                    }}
                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-zinc-700/50"
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

        {/* Camera Modal */}
        {showResearchCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative w-full max-w-2xl rounded-3xl border border-zinc-700/50 bg-zinc-900 p-6">
              <button
                onClick={() => setShowResearchCamera(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/80 text-white hover:bg-red-600"
              >
                ×
              </button>
              <h2 className="mb-4 text-xl font-semibold text-zinc-100">Capture Photo</h2>
              <div className="mb-4 overflow-hidden rounded-2xl bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full"
                />
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={capturePhoto}
                  className="rounded-full border border-zinc-700/50 bg-linear-to-br from-blue-500/10 to-zinc-800/80 px-8 py-3 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-blue-500/20"
                >
                  Take Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Captured Image Display */}
        {capturedImage && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-6">
            <div className="relative inline-block rounded-2xl border border-zinc-700/50 bg-zinc-900/50 p-2">
              <img
                src={capturedImage}
                alt="Captured"
                className="max-h-64 rounded-xl"
              />
              <button
                onClick={removePhoto}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-600"
              >
                ×
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">Photo will be included with your research query</p>
          </div>
        )}

        {/* Loading ideas state */}
        {loadingIdeas && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-12 flex flex-col items-center justify-center gap-4">
            <PixelatedCanvas
              src="/assets/gpu.png"
              width={600}
              height={400}
              cellSize={2}
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
              className="rounded-3xl"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Generating research ideas...
            </p>
          </div>
        )}

        {/* Generated ideas */}
        {generatedIdeas.length > 0 && !loading && !loadingQuestions && !showQuestions && !responses.length && (
          <div className="mb-12">
            <div className="mb-6">
              <h3 className="mb-2 text-2xl font-semibold text-zinc-100">Research Ideas</h3>
              <p className="text-sm text-zinc-400">Click any topic below to start your research</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {generatedIdeas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(idea)}
                  className="rounded-3xl border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
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
            {loadingLocation && (
              <div className="mb-8">
                <div className="mx-auto max-w-md rounded-3xl border border-zinc-700/50 bg-linear-to-br from-blue-500/5 to-zinc-800/80 p-8 backdrop-blur-md">
                  <div className="mb-6 flex justify-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700/30 border-t-zinc-100"></div>
                  </div>
                  <p className="text-center text-base font-medium text-zinc-100">
                    Gathering research ideas...
                  </p>
                </div>
              </div>
            )}

            {!loadingLocation && <InteractiveGlobe onLocationSelect={handleLocationSelect} />}

            {selectedLocation && locationSuggestions.length > 0 && (
              <div className="mt-8">
                <h3 className="mb-4 text-xl font-semibold">
                  Research Ideas from {selectedLocation}
                </h3>

                {locationNews.length > 0 && (
                  <div className="mb-6 rounded-3xl border border-zinc-200 p-4 dark:border-zinc-800">
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
                      className="rounded-3xl border border-zinc-200 p-4 text-left transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-900"
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
              src="/assets/gpu.png"
              width={600}
              height={400}
              cellSize={2}
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
              className="rounded-3xl"
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
              <JumpingTextInstagram
                text={questions[currentQuestionIndex]}
                mode="character"
                className="mb-4 block text-xl font-medium text-zinc-900 dark:text-zinc-100"
              />
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

        {/* Research Plan Loading */}
        {loadingResearchPlan && (
          <div className="mb-12 flex flex-col items-center justify-center gap-4">
            <PixelatedCanvas
              src="/assets/gpu.png"
              width={600}
              height={400}
              cellSize={2}
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
              className="rounded-3xl"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Creating your research strategy...
            </p>
          </div>
        )}

        {/* Research Plan Review */}
        {showResearchPlan && researchTasks.length > 0 && (
          <div className="mb-12">
            <div className="mb-4">
              <h2 className="mb-1 text-2xl font-semibold text-zinc-100">Research Strategy</h2>
              <p className="text-sm text-zinc-400">
                Drag models to tasks
              </p>
            </div>

            <div className="mb-6 space-y-3">
              {researchTasks.map((task, index) => {
                const assignedModels = taskAssignments[task.id] || [];
                return (
                  <div
                    key={task.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-blue-500/50', 'bg-blue-500/5');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-blue-500/50', 'bg-blue-500/5');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-blue-500/50', 'bg-blue-500/5');
                      const modelId = e.dataTransfer.getData('modelId');
                      if (modelId) {
                        const newAssignments = { ...taskAssignments };
                        if (!newAssignments[task.id]) {
                          newAssignments[task.id] = [];
                        }
                        if (!newAssignments[task.id].includes(modelId)) {
                          newAssignments[task.id].push(modelId);
                          setTaskAssignments(newAssignments);
                        }
                      }
                    }}
                    className="group/task relative rounded-2xl border border-zinc-700/50 bg-linear-to-br from-zinc-800/80 to-zinc-900/80 p-4 backdrop-blur-md transition-all"
                  >
                    <button
                      onClick={() => {
                        const newTasks = researchTasks.filter(t => t.id !== task.id);
                        setResearchTasks(newTasks);
                        const newAssignments = { ...taskAssignments };
                        delete newAssignments[task.id];
                        setTaskAssignments(newAssignments);
                      }}
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/80 text-white opacity-100 transition-opacity hover:bg-red-600 md:opacity-0 md:group-hover/task:opacity-100"
                    >
                      ×
                    </button>
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                        <span className="text-base font-semibold">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-zinc-100">{task.title}</h3>
                      </div>
                    </div>

                    {/* Assigned Models */}
                    <div className="relative rounded-xl border border-zinc-700/30 bg-zinc-900/30 p-3">
                      {assignedModels.length === 0 ? (
                        <button
                          onClick={() => setShowModelPickerForTask(showModelPickerForTask === task.id ? null : task.id)}
                          className="w-full text-left text-xs text-zinc-600 italic hover:text-zinc-500 transition-colors"
                        >
                          {showModelPickerForTask === task.id ? 'Select a model' : 'Tap to add models'}
                        </button>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {assignedModels.map((modelId) => {
                            const modelInfo = getModelInfo(modelId);
                            const providerStyle = PROVIDER_STYLES[modelInfo.provider];
                            return (
                              <div
                                key={modelId}
                                className="group relative flex items-center gap-1.5 rounded-full border border-zinc-700/50 bg-linear-to-br from-zinc-800/80 to-zinc-900/80 px-2.5 py-1 text-xs backdrop-blur-md"
                              >
                                {providerStyle?.logo ? (
                                  <img
                                    src={providerStyle.logo}
                                    alt={modelInfo.provider}
                                    className="h-3.5 w-3.5 rounded object-contain"
                                  />
                                ) : (
                                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded bg-zinc-700 text-xs">
                                    {modelInfo.provider.charAt(0)}
                                  </span>
                                )}
                                <span className="text-zinc-200">{modelInfo.name}</span>
                                <button
                                  onClick={() => {
                                    const newAssignments = { ...taskAssignments };
                                    newAssignments[task.id] = newAssignments[task.id].filter(id => id !== modelId);
                                    if (newAssignments[task.id].length === 0) {
                                      delete newAssignments[task.id];
                                    }
                                    setTaskAssignments(newAssignments);
                                  }}
                                  className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                          <button
                            onClick={() => setShowModelPickerForTask(showModelPickerForTask === task.id ? null : task.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-zinc-700/50 text-zinc-600 hover:border-zinc-600 hover:text-zinc-500 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {/* Model Picker Dropdown */}
                      {showModelPickerForTask === task.id && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-9999 rounded-xl border border-zinc-700/50 bg-zinc-900/95 backdrop-blur-md p-2 shadow-xl max-h-64 overflow-y-auto">
                          <div className="space-y-1">
                            {selectedModels.filter(modelId => !assignedModels.includes(modelId)).length === 0 ? (
                              <p className="text-xs text-zinc-600 italic p-2">All models assigned</p>
                            ) : (
                              selectedModels.filter(modelId => !assignedModels.includes(modelId)).map(modelId => {
                                const modelInfo = getModelInfo(modelId);
                                const providerStyle = PROVIDER_STYLES[modelInfo.provider];
                                return (
                                  <button
                                    key={modelId}
                                    onClick={() => {
                                      const newAssignments = { ...taskAssignments };
                                      if (!newAssignments[task.id]) {
                                        newAssignments[task.id] = [];
                                      }
                                      newAssignments[task.id].push(modelId);
                                      setTaskAssignments(newAssignments);
                                      setShowModelPickerForTask(null);
                                    }}
                                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                                  >
                                    {providerStyle?.logo ? (
                                      <img
                                        src={providerStyle.logo}
                                        alt={modelInfo.provider}
                                        className="h-4 w-4 rounded object-contain"
                                      />
                                    ) : (
                                      <span className="flex h-4 w-4 items-center justify-center rounded bg-zinc-700 text-xs">
                                        {modelInfo.provider.charAt(0)}
                                      </span>
                                    )}
                                    <span>{modelInfo.name}</span>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add New Task */}
              <div className="rounded-2xl border border-dashed border-zinc-700/50 bg-zinc-900/30 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTask();
                      }
                    }}
                    placeholder="Add custom research task..."
                    className="flex-1 rounded-lg border border-zinc-700/50 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
                  />
                  <button
                    onClick={handleAddTask}
                    className="rounded-lg border border-zinc-700/50 bg-linear-to-br from-green-500/10 to-zinc-800/80 px-4 py-2 text-sm font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-green-500/20"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={handleRegeneratePlan}
                disabled={loadingResearchPlan}
                className="w-full rounded-full border border-zinc-700/50 bg-linear-to-br from-orange-500/5 to-zinc-800/80 px-8 py-3.5 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-orange-500/10 disabled:opacity-50 sm:w-auto"
              >
                {loadingResearchPlan ? 'Regenerating...' : 'Regenerate Plan'}
              </button>
              <button
                onClick={handleApprovePlan}
                disabled={Object.keys(taskAssignments).length === 0}
                className="w-full rounded-full border border-zinc-700/50 bg-linear-to-br from-blue-500/10 to-zinc-800/80 px-8 py-3.5 text-base font-medium text-zinc-100 backdrop-blur-md transition-all hover:border-zinc-600/60 hover:from-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                Approve & Start Research →
              </button>
            </div>
          </div>
        )}

        {/* Prompt Preview & Approval */}
        {showPromptPreview && (
          <div className="mb-12">
            <div className="mb-4">
              <h2 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Review Your Research Prompt
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This is the final prompt that will be sent to all AI models. You can edit it if needed.
              </p>
            </div>

            <div className="mb-6">
              <textarea
                value={editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                className="w-full min-h-[200px] rounded-3xl border-2 border-zinc-300 bg-white p-4 font-mono text-sm outline-none transition-colors focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-100"
                placeholder="Edit your prompt..."
              />
            </div>

            <div className="flex items-start">
              <button
                onClick={() => {
                  setShowPromptPreview(false);
                  setShowQuestions(true);
                }}
                className="text-sm text-zinc-600 transition-opacity hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                ← Back to Questions
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="mb-8 flex flex-col items-center justify-center gap-4">
            <PixelatedCanvas
              src="/assets/space-satelite.png"
              width={600}
              height={400}
              cellSize={2}
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
              className="rounded-3xl"
            />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Gathering comprehensive insights...
            </p>
          </div>
        )}

        {/* Model selector - show during prompt preview */}
        {!loading && !loadingQuestions && !showQuestions && !responses.length && showPromptPreview && (
          <div className={`relative ${showBench ? 'mb-32' : 'mb-8'}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-medium text-zinc-100">
                {showPromptPreview ? 'Choose Your Research Roster' : 'Research Team'}
              </h3>
              <button
                onClick={() => setShowBench(!showBench)}
                className="text-sm text-zinc-400 hover:text-zinc-100"
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
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, modelId, true)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnTeam(e, index)}
                    className="relative rounded-3xl"
                  >
                    <GlowingEffect
                      spread={40}
                      glow={true}
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                    />
                    <div
                      className={`group relative rounded-3xl border p-2 text-left transition-colors ${
                        showBench
                          ? 'cursor-move border-zinc-300 hover:border-blue-500 dark:border-zinc-700 dark:hover:border-blue-500'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      {/* Remove button - always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModel(modelId);
                        }}
                        className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-100 shadow-lg transition-all hover:bg-red-600 active:scale-90 md:h-5 md:w-5 md:opacity-0 md:group-hover:opacity-100"
                        title="Remove from team"
                      >
                        <svg className="h-3.5 w-3.5 md:h-3 md:w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
                          {PROVIDER_STYLES[modelInfo.provider]?.logo ? (
                            <img
                              src={PROVIDER_STYLES[modelInfo.provider].logo}
                              alt={modelInfo.provider}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-semibold text-zinc-600">
                              {modelInfo.provider.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-0.5 text-base text-zinc-400 md:text-sm">{modelInfo.provider}</div>
                          <div className="text-lg font-medium text-zinc-100 truncate md:text-base">{modelInfo.name}</div>
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
                  className="flex items-center justify-center rounded-3xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:border-blue-600 dark:hover:bg-blue-950/40"
                  style={{ minHeight: '80px' }}
                >
                  <div className="text-center">
                    <div className="text-3xl text-blue-500 dark:text-blue-400">+</div>
                    <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">Drag here to add</div>
                  </div>
                </div>
              )}
            </div>

            {/* Start Research Button - only show during prompt preview */}
            {showPromptPreview && (
              <div className="mt-6 flex justify-center">
                <GetStartedButton
                  text="Start Research"
                  onClick={handleStartResearch}
                  className="w-48"
                />
              </div>
            )}

            {/* Bench Bottom Drawer */}
            {showBench && (
              <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[28vh] overflow-hidden rounded-t-3xl border-t border-zinc-700/50 bg-linear-to-br from-zinc-800/98 to-zinc-900/98 shadow-2xl backdrop-blur-xl">
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">Bench</h3>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        <span className="hidden md:inline">Drag models to your team or drag team members here to bench them</span>
                        <span className="md:hidden">Tap models to add to your team (max 6)</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setShowBench(false)}
                      className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div
                    className="overflow-y-auto pb-4"
                    style={{ maxHeight: 'calc(28vh - 100px)' }}
                    onDragOver={handleDragOver}
                    onDrop={handleDropOnBench}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {AVAILABLE_MODELS.filter(model => !selectedModels.includes(model.id)).map((model) => (
                        <div
                          key={model.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, model.id, false)}
                          onClick={() => {
                            // Mobile tap to add
                            if (selectedModels.length < 6) {
                              setSelectedModels([...selectedModels, model.id]);
                              localStorage.setItem('selectedModels', JSON.stringify([...selectedModels, model.id]));
                            }
                          }}
                          className="relative cursor-pointer rounded-3xl border border-zinc-700/50 bg-linear-to-br from-zinc-700/30 to-zinc-800/50 p-4 transition-all hover:border-zinc-600 hover:from-zinc-700/50 active:scale-95"
                        >
                          {/* Add icon - visible on mobile */}
                          <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg md:hidden">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                              style={{
                                backgroundColor: PROVIDER_STYLES[model.provider]?.bg || '#F5F5F5',
                              }}
                            >
                              {PROVIDER_STYLES[model.provider]?.logo ? (
                                <img
                                  src={PROVIDER_STYLES[model.provider].logo}
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
                              <div className="text-base font-medium truncate text-zinc-100">{model.name}</div>
                              <div className="text-sm text-zinc-400">{model.provider}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
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
                  className="rounded-3xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: PROVIDER_STYLES[modelInfo.provider]?.bg || '#F5F5F5',
                      }}
                    >
                      {PROVIDER_STYLES[modelInfo.provider]?.logo ? (
                        <img
                          src={PROVIDER_STYLES[modelInfo.provider].logo}
                          alt={modelInfo.provider}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-600">
                          {modelInfo.provider.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold md:text-xs">{modelInfo.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 md:text-[10px]">{modelInfo.provider}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 md:h-2.5" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 md:h-2.5" />
                    <div className="h-3 w-4/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 md:h-2.5" />
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
                  className="rounded-3xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                      style={{
                        backgroundColor: PROVIDER_STYLES[modelInfo.provider]?.bg || '#F5F5F5',
                      }}
                    >
                      {PROVIDER_STYLES[modelInfo.provider]?.logo ? (
                        <img
                          src={PROVIDER_STYLES[modelInfo.provider].logo}
                          alt={modelInfo.provider}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-zinc-600">
                          {modelInfo.provider.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold md:text-xs">{response.name}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 md:text-[10px]">{modelInfo.provider}</p>
                    </div>
                  </div>
                  {response.error ? (
                    <div className="rounded-md bg-red-50 p-3 dark:bg-red-950/20">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400 md:text-xs">Error:</p>
                      <p className="mt-1 text-sm text-red-600 dark:text-red-300 md:text-xs">{response.error}</p>
                    </div>
                  ) : !response.text ? (
                    <div className="rounded-md bg-yellow-50 p-3 dark:bg-yellow-950/20">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400 md:text-xs">No response received from this model</p>
                    </div>
                  ) : (
                    <>
                      <div
                        className={`prose prose-sm prose-zinc dark:prose-invert max-w-none md:prose-xs ${
                          !isExpanded ? 'max-h-32 overflow-y-auto' : ''
                        }`}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{response.text}</ReactMarkdown>
                      </div>
                      <button
                        onClick={() => toggleCard(index)}
                        className="mt-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 md:text-xs"
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
            <div className="rounded-3xl border-2 border-zinc-200 p-8 dark:border-zinc-800">
              <div
                className={`prose prose-zinc dark:prose-invert max-w-none ${
                  !synthesisExpanded ? 'max-h-64 overflow-y-auto' : ''
                }`}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{synthesis}</ReactMarkdown>
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

        {/* Auth Modal - Mobile Optimized */}
        {showAuthModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => setShowAuthModal(false)}
            />

            {/* Modal - Bottom sheet on mobile, centered on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-50 md:inset-0 md:flex md:items-center md:justify-center">
              <div className="w-full rounded-t-2xl bg-white p-6 shadow-2xl transition-transform md:w-auto md:min-w-[400px] md:rounded-2xl dark:bg-zinc-900">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </h3>
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {authMode === 'signup' && (
                  <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                    Create an account to save your research to your personal collection
                  </p>
                )}

                {/* Form */}
                <div className="space-y-4">
                  {authMode === 'signup' && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Name
                      </label>
                      <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-base outline-none transition-colors focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:border-zinc-100"
                    />
                  </div>

                  <button
                    onClick={authMode === 'signin' ? handleSignIn : handleSignup}
                    className="w-full rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {authMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                      className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    >
                      {authMode === 'signin'
                        ? "Don't have an account? Sign up"
                        : 'Already have an account? Sign in'}
                    </button>
                  </div>

                  {authMode === 'signup' && (
                    <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
                      By signing up, you agree to our Terms of Service and Privacy Policy
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}
