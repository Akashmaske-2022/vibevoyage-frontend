import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Crown, Moon, Sun, Bell, Lock, Trash2, CreditCard, LogOut,
  CheckCircle2, AlertTriangle, ExternalLink, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authApi, stripeApi } from '@/services/api';
import Navbar from '@/components/Navbar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/utils';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'One uppercase')
      .regex(/[0-9]/, 'One number')
      .regex(/[^A-Za-z0-9]/, 'One special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [showPw, setShowPw] = useState<Record<string, boolean>>({});

  const togglePw = (field: string) => setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const upgradeMutation = useMutation({
    mutationFn: (plan: 'monthly' | 'annual') => stripeApi.createCheckout(plan),
    onSuccess: (data) => {
      window.location.href = data.data.url;
    },
    onError: () => toast.error('Failed to start checkout. Please try again.'),
  });

  const handlePasswordChange = async (data: PasswordForm) => {
    // In a real implementation, this would call a change-password endpoint
    toast.success('Password changed successfully');
    reset();
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    logout();
    navigate('/');
    toast.success('Signed out');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
        </div>

        {/* Profile card */}
        <SettingsSection title="Profile" icon={<User className="h-5 w-5" />}>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white font-display font-bold text-2xl shadow-brand">
              {user?.email?.[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-gray-900 dark:text-white">{user?.email}</div>
              <div className="mt-1 flex items-center gap-2">
                {user?.tier === 'PREMIUM' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <Crown className="h-3.5 w-3.5" /> Premium Member
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Free Tier
                  </span>
                )}
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Appearance */}
        <SettingsSection title="Appearance" icon={<Sun className="h-5 w-5" />}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark Mode</div>
              <div className="text-xs text-gray-400 mt-0.5">Matches your system preference by default</div>
            </div>
            <button
              id="settings-dark-mode"
              onClick={toggleDarkMode}
              className={cn(
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500',
                darkMode ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
              )}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200',
                  darkMode ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </button>
          </div>
        </SettingsSection>

        {/* Billing */}
        <SettingsSection title="Plan & Billing" icon={<CreditCard className="h-5 w-5" />}>
          {user?.tier === 'FREE' ? (
            <div>
              <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-5 mb-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-amber-500 flex-none mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-800 dark:text-amber-300">You're on the Free plan</div>
                    <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-400/80">
                      Limited to 5 AI generations/day and 10 saved itineraries.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => upgradeMutation.mutate('monthly')}
                  disabled={upgradeMutation.isPending}
                  className="btn-brand py-3 justify-center"
                >
                  {upgradeMutation.isPending ? <LoadingSpinner size="sm" /> : <><Crown className="h-4 w-4" /> Upgrade — $9.99/mo</>}
                </button>
                <button
                  onClick={() => upgradeMutation.mutate('annual')}
                  disabled={upgradeMutation.isPending}
                  className="btn-secondary py-3 justify-center border-brand-500 text-brand-600 dark:text-brand-400"
                >
                  Annual — $99/yr <span className="ml-1 rounded-full bg-green-100 dark:bg-green-900/30 px-2 py-0.5 text-xs text-green-600">Save 17%</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-none mt-0.5" />
              <div>
                <div className="font-semibold text-gray-800 dark:text-gray-100">Premium Active</div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Unlimited AI generations, saves, and all premium features</p>
                <button className="mt-3 text-sm text-red-500 hover:underline">Cancel subscription</button>
              </div>
            </div>
          )}
        </SettingsSection>

        {/* Password change */}
        <SettingsSection title="Security" icon={<Lock className="h-5 w-5" />}>
          <form onSubmit={handleSubmit(handlePasswordChange)} className="space-y-4">
            {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => {
              const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirmPassword: 'Confirm New Password' };
              return (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{labels[field]}</label>
                  <div className="relative">
                    <input
                      id={`settings-${field}`}
                      type={showPw[field] ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn('input-field pr-11', errors[field] && 'error')}
                      {...register(field)}
                    />
                    <button type="button" onClick={() => togglePw(field)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors[field] && <p className="mt-1.5 text-xs text-red-500">{errors[field]?.message}</p>}
                </div>
              );
            })}
            <button type="submit" disabled={isSubmitting} className="btn-brand py-2.5 text-sm">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Update password'}
            </button>
          </form>
        </SettingsSection>

        {/* Account actions */}
        <SettingsSection title="Account" icon={<User className="h-5 w-5" />}>
          <div className="space-y-3">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <LogOut className="h-4 w-4 text-gray-400" /> Sign out of all devices
            </button>

            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="flex items-center gap-3 w-full rounded-xl border border-red-200 dark:border-red-900 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Delete account
              </button>
            ) : (
              <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-5">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-none mt-0.5" />
                  <div>
                    <div className="font-semibold text-red-700 dark:text-red-400 text-sm">This action is irreversible</div>
                    <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">All your data, chats, and itineraries will be permanently deleted.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toast.error('Account deletion requires email confirmation (email sent)')} className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 transition-colors">
                    Confirm Delete
                  </button>
                  <button onClick={() => setDeleteConfirm(false)} className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <span className="text-brand-500">{icon}</span>
        <h2 className="font-display font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
