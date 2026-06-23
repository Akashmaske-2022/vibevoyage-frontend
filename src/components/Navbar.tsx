import { Link, useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Settings, Map, MessageSquare, Crown, MessageSquarePlus } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authApi } from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import FeedbackModal from '@/components/FeedbackModal';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useUIStore();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-white/8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-DEFAULT text-white font-bold text-sm shadow-brand group-hover:shadow-elevated transition-shadow">
            ✈
          </div>
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white">
            Vibe<span className="gradient-text">Voyage</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        {isAuthenticated ? (
          <div className="hidden items-center gap-1 md:flex">
            <NavLink to="/chat" icon={<MessageSquare className="h-4 w-4" />}>Chat</NavLink>
            <NavLink to="/itineraries" icon={<Map className="h-4 w-4" />}>Itineraries</NavLink>
          </div>
        ) : (
          <div className="hidden items-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400 md:flex">
            <a href="#features" className="hover:text-brand-500 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-brand-500 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-500 transition-colors">FAQ</a>
          </div>
        )}

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            id="dark-mode-toggle"
            onClick={toggleDarkMode}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Feedback button — only for authenticated users */}
          {isAuthenticated && (
            <>
              <button
                id="feedback-trigger-nav"
                onClick={() => setFeedbackOpen(true)}
                className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                aria-label="Give feedback"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Feedback
              </button>
              <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} />
            </>
          )}

          {isAuthenticated ? (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  id="user-menu-trigger"
                  className="flex items-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block max-w-[120px] truncate text-gray-700 dark:text-gray-200">
                    {user?.email?.split('@')[0]}
                  </span>
                  {user?.tier === 'PREMIUM' && (
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={8}
                  className="z-50 w-56 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-1.5 animate-fade-in"
                >
                  <div className="px-3 py-2 mb-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.email}</p>
                    {user?.tier === 'PREMIUM' ? (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    ) : (
                      <span className="mt-1 inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                        Free
                      </span>
                    )}
                  </div>
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                  <DropdownMenuItem icon={<MessageSquare className="h-4 w-4" />} onClick={() => navigate('/chat')}>
                    Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={<Map className="h-4 w-4" />} onClick={() => navigate('/itineraries')}>
                    My Itineraries
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={<Settings className="h-4 w-4" />} onClick={() => navigate('/settings')}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenu.Separator className="my-1 h-px bg-gray-100 dark:bg-gray-700" />
                  <DropdownMenuItem icon={<LogOut className="h-4 w-4" />} onClick={handleLogout} danger>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/signup"
                className="btn-brand text-sm px-4 py-2"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-500 transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}

function DropdownMenuItem({
  icon,
  children,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <DropdownMenu.Item
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer outline-none transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
      )}
    >
      {icon}
      {children}
    </DropdownMenu.Item>
  );
}
