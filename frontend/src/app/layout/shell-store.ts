import { create } from 'zustand'

type Panel = 'search' | 'categories' | 'cart' | null

type ShellState = {
  openPanel: Panel
  open: (panel: Exclude<Panel, null>) => void
  close: () => void
}

export const useShellStore = create<ShellState>()((set) => ({
  openPanel: null,
  open: (panel) => set({ openPanel: panel }),
  close: () => set({ openPanel: null }),
}))
