import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send, Plus, Trash2, MessageSquare, Sparkles, Map,
  AlertCircle, Crown, Loader2, ChevronLeft, ChevronRight,
  Brain, DollarSign, Clock, Globe, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { chatApi, aiApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, formatRelativeDate, formatCurrency } from '@/lib/utils';

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  extractedData?: ExtractedData | null;
  timestamp: string;
}

interface ExtractedData {
  mood: string;
  budget: number;
  destinations: string[];
  duration: number;
  travelStyle: string[];
  extractionConfidence: number;
  _isMock?: boolean;
  _isFallback?: boolean;
}

interface Session {
  sessionId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
  lastMessage?: { content: string; role: string } | null;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const queryClientRQ = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => chatApi.getSessions().then((r) => r.data),
  });

  const sessions: Session[] = sessionsData?.sessions || [];

  // Load messages when active session changes
  const { isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', activeSessionId],
    queryFn: () => chatApi.getMessages(activeSessionId!).then((r) => r.data),
    enabled: !!activeSessionId,
    onSuccess: (data: any) => {
      setMessages(data.messages || []);
      // Restore extracted data from last assistant message
      const lastExtracted = [...(data.messages || [])].reverse().find(
        (m: Message) => m.extractedData
      );
      if (lastExtracted?.extractedData) {
        setExtractedData(lastExtracted.extractedData);
      }
    },
  } as Parameters<typeof useQuery>[0]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createSessionMutation = useMutation({
    mutationFn: () => chatApi.createSession().then((r) => r.data),
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
      setMessages([]);
      setExtractedData(null);
      queryClientRQ.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: () => toast.error('Failed to create session'),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClientRQ.invalidateQueries({ queryKey: ['sessions'] });
      if (activeSessionId) {
        setActiveSessionId(null);
        setMessages([]);
        setExtractedData(null);
      }
      toast.success('Session deleted');
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, content }: { sessionId: string; content: string }) => {
      const res = await chatApi.sendMessage(sessionId, content);
      return res.data;
    },
  });

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;

    let sessionId = activeSessionId;

    // Auto-create session if none active
    if (!sessionId) {
      try {
        const session = await chatApi.createSession().then((r) => r.data);
        sessionId = session.sessionId;
        setActiveSessionId(sessionId);
        queryClientRQ.invalidateQueries({ queryKey: ['sessions'] });
      } catch {
        toast.error('Failed to create chat session');
        return;
      }
    }

    const content = input.trim();
    setInput('');

    // Optimistic user message
    const tempId = `temp-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      role: 'USER',
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Store message on server
      await sendMessageMutation.mutateAsync({ sessionId: sessionId!, content });

      // Run AI extraction
      setIsExtracting(true);
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const extractRes = await aiApi.extractTravelData(sessionId!, history);
      const { extracted, isMock, isFallback } = extractRes.data;
      setExtractedData(extracted);

      // Add AI response message
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'ASSISTANT',
        content: buildAIResponse(extracted, isFallback),
        extractedData: extracted,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      queryClientRQ.invalidateQueries({ queryKey: ['sessions'] });

      if (isMock) {
        toast.info('Using demo mode — add GEMINI_API_KEY for real AI', { duration: 6000 });
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; error?: string }; status?: number } };
      if (e?.response?.status === 429) {
        setMessages((prev) => [...prev, {
          id: `err-${Date.now()}`,
          role: 'ASSISTANT',
          content: e.response?.data?.error || 'Daily limit reached. Upgrade to Premium for unlimited access!',
          timestamp: new Date().toISOString(),
        }]);
        useUIStore.getState().setUpgradeModalOpen(true);
      } else {
        toast.error('Failed to get AI response');
      }
    } finally {
      setIsTyping(false);
      setIsExtracting(false);
    }
  }, [input, activeSessionId, messages, sendMessageMutation, queryClientRQ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGenerateItinerary = useCallback(async () => {
    if (!activeSessionId || !extractedData) return;
    navigate(`/chat/${activeSessionId}/itinerary?moodData=${encodeURIComponent(JSON.stringify(extractedData))}`);
  }, [activeSessionId, extractedData, navigate]);

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Sidebar ─── */}
        <aside
          className={cn(
            'flex flex-col border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 transition-all duration-300',
            sidebarOpen ? 'w-72 flex-none' : 'w-0 overflow-hidden'
          )}
        >
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex-none">
            <button
              id="new-chat-btn"
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending}
              className="btn-brand w-full py-2.5 text-sm"
            >
              {createSessionMutation.isPending ? <LoadingSpinner size="sm" /> : <><Plus className="h-4 w-4" /> New Chat</>}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <div className="space-y-2 p-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                No chats yet. Start one!
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl px-3 py-2.5 mb-1 cursor-pointer transition-colors',
                    activeSessionId === session.sessionId
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  onClick={() => setActiveSessionId(session.sessionId)}
                >
                  <MessageSquare className="h-3.5 w-3.5 flex-none opacity-60" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{session.title}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">{formatRelativeDate(session.updatedAt)}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSessionMutation.mutate(session.sessionId); }}
                    className="flex-none opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 transition-all"
                    aria-label="Delete session"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* User tier badge */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-none">
            {user?.tier === 'FREE' ? (
              <button
                onClick={() => useUIStore.getState().setUpgradeModalOpen(true)}
                className="w-full flex items-center gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 text-sm"
              >
                <Crown className="h-4 w-4 text-amber-500" />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs">Free tier</div>
                  <div className="text-xs text-amber-600/70 dark:text-amber-500/70">5 AI calls/day</div>
                </div>
                <span className="text-xs text-amber-600 font-medium">Upgrade →</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Premium</span>
              </div>
            )}
          </div>
        </aside>

        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-8 w-5 items-center justify-center rounded-r-lg border border-l-0 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 hover:text-brand-500 transition-colors shadow-sm"
          style={{ left: sidebarOpen ? '288px' : '0' }}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>

        {/* ─── Main Chat Area ─── */}
        <main className="flex flex-1 flex-col overflow-hidden relative">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6" role="log" aria-label="Chat messages" aria-live="polite">
            {!activeSessionId ? (
              <EmptyState onNewChat={() => createSessionMutation.mutate()} />
            ) : messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" />
              </div>
            ) : messages.length === 0 ? (
              <ChatEmptyPrompt />
            ) : (
              <div className="max-w-2xl mx-auto space-y-4">
                <AnimatePresence>
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                </AnimatePresence>
                {isTyping && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 sm:px-8 py-4 flex-none">
            <div className="max-w-2xl mx-auto">
              <div className="relative flex items-end gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-400 transition-all">
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What kind of trip are you dreaming of? Tell me your vibe..."
                  className="flex-1 resize-none bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none min-h-[24px] max-h-32"
                  rows={1}
                  maxLength={500}
                  aria-label="Chat message input"
                />
                <div className="flex items-center gap-2 flex-none">
                  <span className="text-xs text-gray-300 dark:text-gray-600">{input.length}/500</span>
                  <button
                    id="send-btn"
                    onClick={handleSend}
                    disabled={!input.trim() || isExtracting}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>

        {/* ─── Right Panel: Mood Extraction Card ─── */}
        <aside className="hidden lg:flex flex-col w-80 border-l border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-4 overflow-y-auto">
          <div className="font-display font-semibold text-sm mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-brand-500" />
            Travel Vibe Analysis
          </div>

          {extractedData ? (
            <MoodExtractionCard data={extractedData} onGenerate={handleGenerateItinerary} />
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
              <Sparkles className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Start chatting and your travel preferences will appear here
              </p>
            </div>
          )}
        </aside>
      </div>

      <UpgradeModal />
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT flex items-center justify-center text-white text-2xl mb-6 shadow-brand">✈</div>
      <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Start planning your next adventure</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
        Click "New Chat" or start typing to let AI discover your perfect destination
      </p>
      <button onClick={onNewChat} className="btn-brand mt-6">
        <Plus className="h-4 w-4" /> New Chat
      </button>
    </div>
  );
}

function ChatEmptyPrompt() {
  const suggestions = [
    "I'm feeling spontaneous with $1500 for a week",
    "Romantic beach getaway for 2, 5 days, $2000",
    "Solo adventure in Southeast Asia, budget traveler",
    "Family-friendly Europe trip, 10 days",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-4">Try one of these to get started:</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hover:border-brand-400 hover:text-brand-600 transition-colors"
              onClick={() => {
                const el = document.getElementById('chat-input') as HTMLTextAreaElement;
                if (el) { el.value = s; el.dispatchEvent(new Event('input', { bubbles: true })); el.focus(); }
              }}
            >
              "{s}"
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'USER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white text-xs font-bold shadow-sm">
          AI
        </div>
      )}
      <div className={cn('max-w-[80%]', isUser ? 'msg-user' : 'msg-ai')}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        {!isUser && message.extractedData && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
            {[
              { icon: Brain, label: 'Mood', value: message.extractedData.mood },
              { icon: DollarSign, label: 'Budget', value: message.extractedData.budget ? formatCurrency(message.extractedData.budget) : 'TBD' },
              { icon: Clock, label: 'Duration', value: message.extractedData.duration ? `${message.extractedData.duration}d` : 'TBD' },
              { icon: Globe, label: 'Top Dest.', value: message.extractedData.destinations?.[0] || 'TBD' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-lg bg-brand-50 dark:bg-brand-900/20 px-2.5 py-1.5">
                <div className="flex items-center gap-1 text-[10px] text-brand-500 font-medium mb-0.5">
                  <Icon className="h-2.5 w-2.5" /> {label}
                </div>
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white text-xs font-bold shadow-sm">
        AI
      </div>
      <div className="msg-ai px-4 py-3 flex gap-1.5 items-center">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

function MoodExtractionCard({ data, onGenerate }: { data: ExtractedData; onGenerate: () => void }) {
  const fields = [
    { icon: Brain, label: 'Mood', value: data.mood || 'Analyzing...', color: 'text-purple-500' },
    { icon: DollarSign, label: 'Budget', value: data.budget ? formatCurrency(data.budget) : 'Not set', color: 'text-green-500' },
    { icon: Clock, label: 'Duration', value: data.duration ? `${data.duration} days` : 'Not set', color: 'text-blue-500' },
    { icon: Globe, label: 'Top Destination', value: data.destinations?.[0] || 'Analyzing...', color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Confidence indicator */}
      <div className="rounded-2xl border border-brand-100 dark:border-brand-900/50 bg-brand-50 dark:bg-brand-900/20 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Extraction Confidence</span>
          <span className="text-xs font-bold text-brand-700 dark:text-brand-300">{data.extractionConfidence || 0}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-brand-100 dark:bg-brand-900">
          <div
            className="h-full rounded-full bg-brand-500 transition-all duration-500"
            style={{ width: `${data.extractionConfidence || 0}%` }}
          />
        </div>
        {data._isMock && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <Info className="h-3.5 w-3.5" /> Demo mode — add API key for real AI
          </div>
        )}
      </div>

      {/* Extracted fields */}
      <div className="grid grid-cols-1 gap-2">
        {fields.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3.5 py-3">
            <Icon className={cn('h-4 w-4 flex-none', color)} />
            <div className="min-w-0">
              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
              <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Travel style tags */}
      {data.travelStyle?.length > 0 && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Travel Style</div>
          <div className="flex flex-wrap gap-1.5">
            {data.travelStyle.map((s) => (
              <span key={s} className="rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* All destinations */}
      {data.destinations?.length > 1 && (
        <div>
          <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">All Suggestions</div>
          <div className="space-y-1">
            {data.destinations.map((dest, i) => (
              <div key={dest} className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400">#{i + 1}</span>
                <span className="text-gray-700 dark:text-gray-300">{dest}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <button
        id="generate-itinerary-btn"
        onClick={onGenerate}
        className="btn-brand w-full py-3"
      >
        <Map className="h-4 w-4" /> Generate Full Itinerary
      </button>
    </div>
  );
}

function UpgradeModal() {
  const { upgradModalOpen, setUpgradeModalOpen } = useUIStore();
  const navigate = useNavigate();

  if (!upgradModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setUpgradeModalOpen(false)} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl p-8 text-center"
      >
        <Crown className="mx-auto h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-2xl font-display font-bold">Upgrade to Premium</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You've hit the free tier limit of 5 AI calls/day. Upgrade for unlimited access.
        </p>
        <div className="mt-6 space-y-3">
          {['Unlimited AI generations', 'Unlimited saved itineraries', 'Multi-city routing', 'PDF export', 'Priority processing'].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-left">
              <Sparkles className="h-4 w-4 text-brand-500 flex-none" />
              {f}
            </div>
          ))}
        </div>
        <button
          onClick={() => { setUpgradeModalOpen(false); navigate('/settings?upgrade=true'); }}
          className="btn-brand w-full mt-6 py-3 text-base"
        >
          Upgrade for $9.99/mo <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => setUpgradeModalOpen(false)}
          className="mt-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Maybe later
        </button>
      </motion.div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

function buildAIResponse(data: ExtractedData, isFallback: boolean): string {
  if (isFallback) return "Unable to refine your preferences — using previous data. Please try again.";

  const dest = data.destinations?.[0] || 'your dream destination';
  const budget = data.budget ? formatCurrency(data.budget) : 'your budget';
  const duration = data.duration ? `${data.duration} days` : 'your trip';

  return `I've analyzed your travel vibe! I'm detecting **${data.mood || 'Adventurous'}** energy with a **${budget}** budget for **${duration}**. Based on your style, I'd suggest ${data.destinations?.slice(0, 3).join(', ') || dest}. Ready to generate your full itinerary?`;
}
