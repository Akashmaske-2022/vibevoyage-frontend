import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import App from './App';
import { queryClient } from './lib/queryClient';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            classNames: {
              toast: 'font-sans text-sm',
              success: 'border-l-4 border-green-500',
              error: 'border-l-4 border-red-500',
            },
          }}
          richColors
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
