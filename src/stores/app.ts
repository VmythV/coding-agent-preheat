/** 全局应用状态（主题、侧边栏开关等） */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AppState {
  theme: "light" | "dark" | "system";
  sidebarOpen: boolean;
  setTheme: (theme: "light" | "dark" | "system") => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: "system",
      sidebarOpen: true,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: "app-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
