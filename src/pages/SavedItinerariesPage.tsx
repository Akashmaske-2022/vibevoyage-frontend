import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, Grid, List, MapPin, DollarSign, Clock, Trash2, Download, Eye, SortDesc } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { itineraryApi } from '@/services/api';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency } from '@/lib/utils';

interface SavedItinerary {
  id: string;
  title: string;
  destination: string;
  duration: number;
  budget: number;
  createdAt: string;
}

type SortKey = 'createdAt' | 'budget' | 'destination';
type ViewMode = 'grid' | 'list';

export default function SavedItinerariesPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [budgetFilter, setBudgetFilter] = useState('');

  const queryClientRQ = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['itineraries', search, budgetFilter, sortBy],
    queryFn: () =>
      itineraryApi.getAll({
        search: search || undefined,
        budgetMax: budgetFilter ? parseFloat(budgetFilter) : undefined,
        limit: 20,
      }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => itineraryApi.delete(id),
    onSuccess: () => {
      queryClientRQ.invalidateQueries({ queryKey: ['itineraries'] });
      toast.success('Itinerary deleted');
    },
  });

  const exportMutation = useMutation({
    mutationFn: (id: string) => itineraryApi.export(id, 'json'),
    onSuccess: (data) => {
      const url = window.URL.createObjectURL(new Blob([data.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibevoyage-itinerary.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported!');
    },
  });

  const itineraries: SavedItinerary[] = data?.itineraries || [];

  const sorted = [...itineraries].sort((a, b) => {
    if (sortBy === 'budget') return b.budget - a.budget;
    if (sortBy === 'destination') return a.destination.localeCompare(b.destination);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">My Itineraries</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {data?.total ?? 0} saved trips
            </p>
          </div>
          <Link to="/chat" className="btn-brand py-2.5 text-sm">+ New Trip</Link>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="itinerary-search"
              type="text"
              placeholder="Search by destination..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9 py-2.5 text-sm"
            />
          </div>

          {/* Budget filter */}
          <select
            value={budgetFilter}
            onChange={(e) => setBudgetFilter(e.target.value)}
            className="input-field py-2.5 text-sm w-auto min-w-36"
          >
            <option value="">All budgets</option>
            <option value="500">Under $500</option>
            <option value="1000">Under $1,000</option>
            <option value="2500">Under $2,500</option>
            <option value="5000">Under $5,000</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="input-field py-2.5 text-sm w-auto min-w-40"
          >
            <option value="createdAt">Most Recent</option>
            <option value="budget">Highest Budget</option>
            <option value="destination">A–Z Destination</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={cn('p-2.5 transition-colors', viewMode === 'grid' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-500')}
              aria-label="Grid view"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2.5 transition-colors', viewMode === 'list' ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-500')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState />
        ) : viewMode === 'grid' ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map((it, i) => (
              <ItineraryCard
                key={it.id}
                itinerary={it}
                index={i}
                onDelete={() => deleteMutation.mutate(it.id)}
                onExport={() => exportMutation.mutate(it.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((it, i) => (
              <ItineraryRow
                key={it.id}
                itinerary={it}
                index={i}
                onDelete={() => deleteMutation.mutate(it.id)}
                onExport={() => exportMutation.mutate(it.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ItineraryCard({ itinerary, index, onDelete, onExport }: {
  itinerary: SavedItinerary;
  index: number;
  onDelete: () => void;
  onExport: () => void;
}) {
  const gradients = [
    'from-brand-500 to-indigo-DEFAULT',
    'from-indigo-DEFAULT to-purple-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
    'from-pink-500 to-rose-500',
    'from-sky-500 to-blue-600',
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-card dark:hover:shadow-card-dark"
    >
      {/* Gradient header */}
      <div className={cn('h-28 bg-gradient-to-br flex items-end p-4', gradients[index % gradients.length])}>
        <div>
          <p className="text-white/70 text-xs font-medium">Destination</p>
          <h3 className="text-white font-display font-bold text-lg leading-tight">{itinerary.destination}</h3>
        </div>
      </div>

      <div className="p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate mb-3">{itinerary.title}</p>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{formatCurrency(itinerary.budget)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{itinerary.duration} days</span>
          <span>{format(new Date(itinerary.createdAt), 'MMM d')}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Link to={`/itineraries/${itinerary.id}`} className="flex-1 btn-secondary py-2 text-xs justify-center">
            <Eye className="h-3.5 w-3.5" /> View
          </Link>
          <button onClick={onExport} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-brand-500 hover:border-brand-400 transition-colors" aria-label="Export">
            <Download className="h-3.5 w-3.5" />
          </button>
          <button onClick={onDelete} className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors" aria-label="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </motion.article>
  );
}

function ItineraryRow({ itinerary, index, onDelete, onExport }: {
  itinerary: SavedItinerary;
  index: number;
  onDelete: () => void;
  onExport: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
    >
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{itinerary.title}</div>
        <div className="text-xs text-gray-400">{itinerary.destination} · {itinerary.duration} days · {formatCurrency(itinerary.budget)}</div>
      </div>
      <div className="text-xs text-gray-400 hidden sm:block">{format(new Date(itinerary.createdAt), 'MMM d, yyyy')}</div>
      <div className="flex gap-1.5">
        <Link to={`/itineraries/${itinerary.id}`} className="p-2 rounded-lg text-gray-400 hover:text-brand-500 transition-colors" aria-label="View">
          <Eye className="h-4 w-4" />
        </Link>
        <button onClick={onExport} className="p-2 rounded-lg text-gray-400 hover:text-brand-500 transition-colors" aria-label="Export">
          <Download className="h-4 w-4" />
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-2xl">🗺️</div>
      <h3 className="text-lg font-display font-semibold">No saved itineraries</h3>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create one from a chat session to see it here.</p>
      <Link to="/chat" className="btn-brand mt-6">Start planning →</Link>
    </div>
  );
}
