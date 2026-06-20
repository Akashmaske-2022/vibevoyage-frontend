import { Link } from 'react-router-dom';
import { Home, Plane } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4 bg-white dark:bg-gray-950">
      <div className="text-7xl font-display font-bold gradient-text mb-2">404</div>
      <div className="text-5xl mb-6">✈️</div>
      <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Oops, this page took a detour</h1>
      <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-sm">
        Looks like this destination doesn't exist on our map. Let's get you back on track.
      </p>
      <Link to="/" className="btn-brand mt-8 px-6 py-3">
        <Home className="h-4 w-4" /> Back to home
      </Link>
    </div>
  );
}
