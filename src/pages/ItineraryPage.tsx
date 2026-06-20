
import { useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft, Download, Save, Calendar, DollarSign, MapPin, Clock,
  Package, ChevronDown, Sunrise, Utensils, Bus, Hotel, Star,
  CheckSquare, Square, Share2, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { aiApi, itineraryApi } from '@/services/api';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency } from '@/lib/utils';

interface Activity {
  time: string;
  name: string;
  description: string;
  estimatedCost: number;
  category: string;
}

interface DayPlan {
  day: number;
  theme: string;
  activities: Activity[];
}

interface Itinerary {
  destination: string;
  duration: number;
  budget: number;
  highlights: string[];
  bestDates: string;
  overview: string;
  days: DayPlan[];
  costBreakdown: Record<string, number>;
  packingList: Record<string, string[]>;
  tips: string[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Sightseeing: <Sunrise className="h-3.5 w-3.5" />,
  Food: <Utensils className="h-3.5 w-3.5" />,
  Transport: <Bus className="h-3.5 w-3.5" />,
  Accommodation: <Hotel className="h-3.5 w-3.5" />,
  Activity: <Star className="h-3.5 w-3.5" />,
};

const COST_COLORS = ['#19a88f', '#5b5ac7', '#f97316', '#22c55e', '#ef4444', '#a855f7'];

export default function ItineraryPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [savedItineraryId, setSavedItineraryId] = useState<string | null>(null);

  const moodDataStr = searchParams.get('moodData');
  const moodData = moodDataStr ? JSON.parse(decodeURIComponent(moodDataStr)) : null;

  // Fetch itinerary (generate if moodData present, else load saved)
  const { data: itineraryData, isLoading, error } = useQuery({
    queryKey: ['itinerary', sessionId, moodData],
    queryFn: async () => {
      if (moodData && sessionId) {
        const res = await aiApi.generateItinerary(sessionId, moodData);
        setSavedItineraryId(res.data.itineraryId);
        return res.data.itinerary as Itinerary;
      }
      return null;
    },
    enabled: !!moodData && !!sessionId,
    staleTime: Infinity,
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'pdf') => {
      if (!savedItineraryId) throw new Error('No saved itinerary');
      return itineraryApi.export(savedItineraryId, format);
    },
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibevoyage-itinerary.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Itinerary exported!');
    },
    onError: () => toast.error('Export failed'),
  });

  const itinerary = itineraryData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Back */}
        <Link to="/chat" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to chat
        </Link>

        {isLoading ? (
          <ItinerarySkeleton />
        ) : error ? (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-8 text-center">
            <p className="text-red-600 dark:text-red-400">Failed to generate itinerary. Please try again from the chat.</p>
          </div>
        ) : itinerary ? (
          <>
            {/* Hero overview card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white p-8 mb-8 shadow-elevated"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-indigo-DEFAULT/30 blur-2xl" />
              <div className="relative">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-white/70 text-sm font-medium mb-1">Your AI-Generated Itinerary</p>
                    <h1 className="text-3xl sm:text-4xl font-display font-bold">{itinerary.destination}</h1>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <Stat icon={<Clock className="h-4 w-4" />} label={`${itinerary.duration} days`} />
                      <Stat icon={<DollarSign className="h-4 w-4" />} label={formatCurrency(itinerary.budget)} />
                      <Stat icon={<Calendar className="h-4 w-4" />} label={itinerary.bestDates} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ActionBtn onClick={() => exportMutation.mutate('json')} disabled={!savedItineraryId || exportMutation.isPending}>
                      <Download className="h-4 w-4" /> Export JSON
                    </ActionBtn>
                    <ActionBtn onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }}>
                      <Share2 className="h-4 w-4" /> Share
                    </ActionBtn>
                  </div>
                </div>
                <p className="mt-4 text-white/80 text-sm max-w-2xl leading-relaxed">{itinerary.overview}</p>
              </div>
            </motion.div>

            {/* Highlights */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {(itinerary.highlights || []).map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex items-start gap-3"
                >
                  <Star className="h-5 w-5 text-amber-400 flex-none mt-0.5" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{h}</span>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Day-by-day (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-display font-bold">Day-by-Day Plan</h2>
                {(itinerary.days || []).map((day, idx) => (
                  <DayAccordion
                    key={day.day}
                    day={day}
                    isOpen={expandedDay === idx}
                    onToggle={() => setExpandedDay(expandedDay === idx ? null : idx)}
                  />
                ))}

                {/* Tips */}
                {itinerary.tips?.length > 0 && (
                  <div className="rounded-2xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-5">
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Local Tips
                    </h3>
                    <ul className="space-y-2">
                      {itinerary.tips.map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-sm text-blue-700/80 dark:text-blue-300/80">
                          <span className="flex-none mt-1">💡</span> {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Right column: cost + packing */}
              <div className="space-y-6">
                {/* Cost breakdown chart */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-brand-500" /> Budget Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={Object.entries(itinerary.costBreakdown || {}).map(([k, v]) => ({ name: k, value: v }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {Object.keys(itinerary.costBreakdown || {}).map((_, i) => (
                          <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatCurrency(val)} />
                      <Legend iconType="circle" iconSize={8} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {Object.entries(itinerary.costBreakdown || {}).map(([key, val], i) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: COST_COLORS[i % COST_COLORS.length] }} />
                          <span className="capitalize text-gray-600 dark:text-gray-400">{key}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(val as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Packing list */}
                <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-brand-500" /> Packing List
                  </h3>
                  {Object.entries(itinerary.packingList || {}).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 capitalize">{category}</div>
                      <div className="space-y-1.5">
                        {(items as string[]).map((item) => {
                          const key = `${category}-${item}`;
                          const checked = checkedItems.has(key);
                          return (
                            <button
                              key={item}
                              onClick={() => {
                                const next = new Set(checkedItems);
                                checked ? next.delete(key) : next.add(key);
                                setCheckedItems(next);
                              }}
                              className={cn(
                                'flex items-center gap-2 text-sm w-full text-left transition-colors',
                                checked ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                              )}
                            >
                              {checked ? <CheckSquare className="h-4 w-4 text-brand-500 flex-none" /> : <Square className="h-4 w-4 text-gray-300 flex-none" />}
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-gray-400">No itinerary data found.</div>
        )}
      </div>
    </div>
  );
}

function DayAccordion({ day, isOpen, onToggle }: { day: DayPlan; isOpen: boolean; onToggle: () => void }) {
  const totalCost = day.activities.reduce((s, a) => s + (a.estimatedCost || 0), 0);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-500 text-white font-bold text-sm">
            {day.day}
          </div>
          <div>
            <div className="font-semibold text-sm">{day.theme}</div>
            <div className="text-xs text-gray-400">{day.activities.length} activities · {formatCurrency(totalCost)}</div>
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-100 dark:border-gray-800"
          >
            <div className="px-5 py-4 space-y-3">
              {day.activities.map((activity, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-mono text-gray-400 w-14 text-right">{activity.time}</div>
                    {i < day.activities.length - 1 && <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mt-1" />}
                  </div>
                  <div className="flex-1 rounded-xl bg-gray-50 dark:bg-gray-800 px-3.5 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">{CATEGORY_ICONS[activity.category] || <Star className="h-3.5 w-3.5" />}</span>
                        <span className="text-sm font-semibold">{activity.name}</span>
                      </div>
                      {activity.estimatedCost > 0 && (
                        <span className="text-xs font-medium text-brand-600 dark:text-brand-400 flex-none">
                          {formatCurrency(activity.estimatedCost)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-white/90 text-sm">
      {icon} {label}
    </div>
  );
}

function ActionBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 px-3.5 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function ItinerarySkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="skeleton h-48 rounded-3xl" />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
        </div>
        <div className="space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
