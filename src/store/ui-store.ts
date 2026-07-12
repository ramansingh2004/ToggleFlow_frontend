import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
} from 'zustand/middleware';

interface UiState {
  isSidebarOpen: boolean;
  selectedProjectId: string | null;

  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  selectProject: (projectId: string | null) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isSidebarOpen: false,
      selectedProjectId: null,

      openSidebar: () =>
        set({ isSidebarOpen: true }),

      closeSidebar: () =>
        set({ isSidebarOpen: false }),

      toggleSidebar: () =>
        set((state) => ({
          isSidebarOpen: !state.isSidebarOpen,
        })),

      selectProject: (projectId) =>
        set((state) => {
          if (state.selectedProjectId === projectId) {
            return state;
          }

          return {
            selectedProjectId: projectId,
          };
        }),
    }),
    {
      name: 'toggleflow-ui',
      storage: createJSONStorage(
        () => localStorage
      ),
      partialize: (state) => ({
        selectedProjectId:
          state.selectedProjectId,
      }),
    }
  )
);