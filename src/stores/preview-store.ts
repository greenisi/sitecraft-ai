import { create } from 'zustand';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface PreviewState {
  viewport: Viewport;
  zoom: number;
  activePage: string;
  showCode: boolean;
  selectedSection: string | null;
  setViewport: (viewport: Viewport) => void;
  setZoom: (zoom: number) => void;
  setActivePage: (page: string) => void;
  toggleCode: () => void;
  setSelectedSection: (section: string | null) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  viewport: 'desktop',
  zoom: 1,
  activePage: '/',
  showCode: false,
  selectedSection: null,
  setViewport: (viewport) => set({ viewport }),
  setZoom: (zoom) => set({ zoom }),
  setActivePage: (activePage) => set({ activePage }),
  toggleCode: () => set((state) => ({ showCode: !state.showCode })),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
}));
