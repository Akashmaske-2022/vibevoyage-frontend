import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  upgradModalOpen: boolean;

  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setUpgradeModalOpen: (open: boolean) => void;
}

/**
 * Zustand UI store with localStorage persistence for dark mode.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      sidebarOpen: true,
      upgradModalOpen: false,

      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle('dark', next);
      },

      setDarkMode: (dark) => {
        set({ darkMode: dark });
        document.documentElement.classList.toggle('dark', dark);
      },

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setUpgradeModalOpen: (open) => set({ upgradModalOpen: open }),
    }),
    {
      name: 'vibevoyage-ui',
      partialize: (state) => ({ darkMode: state.darkMode }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.darkMode);
        }
      },
    }
  )
);
