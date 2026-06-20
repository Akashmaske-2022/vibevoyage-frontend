import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ChatPage from '@/pages/ChatPage';
import ItineraryPage from '@/pages/ItineraryPage';
import SavedItinerariesPage from '@/pages/SavedItinerariesPage';
import SettingsPage from '@/pages/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

import ProtectedRoute from '@/components/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function App() {
  const { isAuthenticated, isLoading, setAuth, setLoading } = useAuthStore();

  // On mount: attempt to restore session via refresh token (httpOnly cookie)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to refresh — if refresh token cookie exists, this will succeed
        const { data: refreshData } = await authApi.me().catch(async () => {
          // If /me fails, try refresh first
          const { data } = await import('axios').then(({ default: axios }) =>
            axios.post('/api/auth/refresh', {}, { withCredentials: true })
          );
          useAuthStore.getState().setAccessToken(data.accessToken);
          return authApi.me();
        });

        setAuth(refreshData.user, useAuthStore.getState().accessToken || '');
      } catch {
        setLoading(false);
      }
    };

    restoreSession();
  }, [setAuth, setLoading]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/auth/login"
        element={isAuthenticated ? <Navigate to="/chat" replace /> : <LoginPage />}
      />
      <Route
        path="/auth/signup"
        element={isAuthenticated ? <Navigate to="/chat" replace /> : <SignupPage />}
      />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:sessionId/itinerary" element={<ItineraryPage />} />
        <Route path="/itineraries" element={<SavedItinerariesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
