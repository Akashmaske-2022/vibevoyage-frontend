import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { authApi } from '@/services/api';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white font-bold">✈</div>
          <span className="font-display font-bold text-xl text-gray-900 dark:text-white">Vibe<span className="text-brand-500">Voyage</span></span>
        </Link>

        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-8 shadow-card">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-brand-500 mb-4" />
              <h2 className="text-2xl font-display font-bold">Check your email</h2>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                If an account exists for that email, we've sent a password reset link. Check your inbox and spam folder.
              </p>
              <Link to="/auth/login" className="mt-6 inline-flex items-center gap-2 text-sm text-brand-500 hover:underline font-medium">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Reset your password</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Enter your email and we'll send you a reset link.
              </p>

              <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                <div>
                  <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="reset-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={cn('input-field pl-10', errors.email && 'error')}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-brand w-full py-3">
                  {isSubmitting ? <LoadingSpinner size="sm" /> : 'Send reset link'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-500 transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
