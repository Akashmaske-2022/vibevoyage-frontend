import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Star, X, MessageSquarePlus, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = 'UI/UX' | 'Bug' | 'Feature Request' | 'Other';

interface FeedbackPayload {
  message: string;
  rating: number;
  category: Category;
}

const CATEGORIES: Category[] = ['UI/UX', 'Bug', 'Feature Request', 'Other'];

const CATEGORY_META: Record<Category, { emoji: string; description: string }> = {
  'UI/UX':           { emoji: '🎨', description: 'Design & experience' },
  'Bug':             { emoji: '🐛', description: 'Something broken' },
  'Feature Request': { emoji: '✨', description: 'New ideas' },
  'Other':           { emoji: '💬', description: 'General feedback' },
};

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            id={`feedback-star-${star}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="group relative transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={cn(
                'h-8 w-8 transition-all duration-150',
                (hovered || value) >= star
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'text-gray-300 dark:text-gray-600 fill-transparent'
              )}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400 animate-fade-in">
          {labels[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────

interface FeedbackModalProps {
  /** Controlled open state. Pass undefined to make it self-controlled. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Renders the trigger button if not using controlled open state */
  trigger?: React.ReactNode;
}

export default function FeedbackModal({ open, onOpenChange, trigger }: FeedbackModalProps) {
  const { isAuthenticated } = useAuthStore();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<Category | ''>('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Only authenticated users should see the feedback form
  if (!isAuthenticated) return null;

  function resetForm() {
    setRating(0);
    setCategory('');
    setMessage('');
    setSubmitted(false);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) resetForm();
    onOpenChange?.(isOpen);
  }

  const mutation = useMutation({
    mutationFn: (payload: FeedbackPayload) => api.post('/feedback', payload),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.error ||
        'Failed to submit feedback. Please try again.';
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    if (!category) {
      toast.error('Please select a category.');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters.');
      return;
    }

    mutation.mutate({
      message: message.trim(),
      rating,
      category: category as Category,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}

      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md rounded-3xl',
            'bg-white dark:bg-gray-900',
            'border border-gray-100 dark:border-gray-800',
            'shadow-2xl shadow-black/10',
            'p-0 overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
            'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
            'duration-200'
          )}
          aria-describedby="feedback-description"
        >
          {/* Header gradient bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 via-purple-500 to-indigo-500" />

          <div className="p-6">
            {/* Close button */}
            <Dialog.Close asChild>
              <button
                id="feedback-close"
                className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-label="Close feedback form"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>

            {submitted ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-display font-bold text-gray-900 dark:text-white">
                    Thank you! 🎉
                  </Dialog.Title>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Your feedback helps us make VibeVoyage better for everyone.
                  </p>
                </div>
                <Dialog.Close asChild>
                  <button
                    id="feedback-done"
                    className="btn-brand mt-2 px-8 py-2.5 text-sm"
                  >
                    Done
                  </button>
                </Dialog.Close>
              </div>
            ) : (
              /* ── Form state ── */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Dialog.Title className="flex items-center gap-2 text-xl font-display font-bold text-gray-900 dark:text-white">
                    <MessageSquarePlus className="h-5 w-5 text-brand-500" />
                    Share Feedback
                  </Dialog.Title>
                  <Dialog.Description
                    id="feedback-description"
                    className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                  >
                    Tell us what you think — we read every message.
                  </Dialog.Description>
                </div>

                {/* Star Rating */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Overall rating
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="flex justify-center rounded-2xl bg-gray-50 dark:bg-gray-800/50 py-4">
                    <StarRating value={rating} onChange={setRating} />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Category
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => {
                      const meta = CATEGORY_META[cat];
                      return (
                        <button
                          key={cat}
                          type="button"
                          id={`feedback-category-${cat.toLowerCase().replace(/[^a-z]/g, '-')}`}
                          onClick={() => setCategory(cat)}
                          className={cn(
                            'flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-all',
                            category === cat
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 shadow-[0_0_0_1px] shadow-brand-500/30'
                              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-brand-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                          )}
                        >
                          <span className="text-base leading-none">{meta.emoji}</span>
                          <div>
                            <div className="font-medium leading-tight">{cat}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">{meta.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="feedback-message"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                  >
                    Message
                    <span className="ml-1 text-red-500">*</span>
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({message.length}/2000)
                    </span>
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                    placeholder="Tell us about your experience, what could be improved, or what you love..."
                    rows={4}
                    className={cn(
                      'w-full rounded-xl border border-gray-200 dark:border-gray-700',
                      'bg-white dark:bg-gray-800',
                      'px-3.5 py-3 text-sm text-gray-900 dark:text-white',
                      'placeholder:text-gray-400 dark:placeholder:text-gray-500',
                      'resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500',
                      'transition-shadow duration-150'
                    )}
                  />
                </div>

                {/* Submit */}
                <button
                  id="feedback-submit"
                  type="submit"
                  disabled={mutation.isPending}
                  className={cn(
                    'btn-brand w-full justify-center gap-2 py-3 text-sm',
                    'disabled:opacity-60 disabled:cursor-not-allowed'
                  )}
                >
                  {mutation.isPending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
