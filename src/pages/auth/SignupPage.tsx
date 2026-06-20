import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, Plane } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { cn, getPasswordStrength } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const schema = z
  .object({
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'One uppercase letter')
      .regex(/[0-9]/, 'One number')
      .regex(/[^A-Za-z0-9]/, 'One special character'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });

type FormData = z.infer<typeof schema>;

const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
const strengthColors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500'];

export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const password = watch('password', '');
  const strength = getPasswordStrength(password);

  const onSubmit = async (data: FormData) => {
    try {
      const res = await authApi.signup({ email: data.email, password: data.password });
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Welcome to VibeVoyage! 🌍');
      navigate('/chat');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      toast.error(e?.response?.data?.error || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — visual panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-500 via-brand-600 to-indigo-DEFAULT items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative text-center text-white">
          <Plane className="mx-auto h-16 w-16 mb-6 opacity-90" />
          <h1 className="text-4xl font-display font-bold">Start your journey</h1>
          <p className="mt-4 text-lg text-white/80">Your dream trip is one conversation away.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { t: '5 free trips/day', d: 'No credit card needed' },
              { t: 'AI-powered', d: 'Gemini understands your vibe' },
              { t: '120+ destinations', d: 'From beaches to mountains' },
              { t: 'Instant export', d: 'PDF & JSON downloads' },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="font-semibold text-sm">{f.t}</div>
                <div className="text-xs text-white/70 mt-0.5">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white font-bold text-sm">✈</div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">Vibe<span className="text-brand-500">Voyage</span></span>
          </Link>

          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Create your account</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Already have one?{' '}
            <Link to="/auth/login" className="text-brand-500 font-medium hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={cn('input-field', errors.email && 'error')}
                {...register('email')}
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className={cn('input-field pr-11', errors.password && 'error')}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={cn('h-1 flex-1 rounded-full transition-colors', i < strength ? strengthColors[strength] : 'bg-gray-200 dark:bg-gray-700')}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">{strengthLabels[strength] || 'Too weak'}</p>
                </div>
              )}
              {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Confirm password</label>
              <div className="relative">
                <input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={cn('input-field pr-11', errors.confirm && 'error')}
                  {...register('confirm')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && <p className="mt-1.5 text-xs text-red-500">{errors.confirm.message}</p>}
            </div>

            <button
              type="submit"
              id="signup-submit"
              disabled={isSubmitting}
              className="btn-brand w-full py-3.5 text-base"
            >
              {isSubmitting ? <LoadingSpinner size="sm" /> : <>Create account <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            By signing up, you agree to our{' '}
            <a href="#" className="text-brand-500 hover:underline">Terms</a> and{' '}
            <a href="#" className="text-brand-500 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
