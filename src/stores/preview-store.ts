import { create } from 'zustand';

type Viewport = 'desktop' | 'tablet' | 'mobile';

interface PreviewState {
  viewport: Viewport;
  zoom: number;
  autoFit: boolean;
  activePage: string;
  showCode: boolean;
  selectedSection: string | null;
  setViewport: (viewport: Viewport) => void;
  setZoom: (zoom: number) => void;
  setAutoFit: (autoFit: boolean) => void;
  setActivePage: (page: string) => void;
  toggleCode: () => void;
  setSelectedSection: (section: string | null) => void;
}

export const usePreviewStore = create<PreviewState>((set) => ({
  viewport: 'desktop',
  zoom: 1,
  autoFit: true,
  activePage: '/',
  showCode: false,
  selectedSection: null,
  setViewport: (viewport) => set({ viewport }),
  setZoom: (zoom) => set({ zoom, autoFit: false }),
  setAutoFit: (autoFit) => set({ autoFit }),
  setActivePage: (activePage) => set({ activePage }),
  toggleCode: () => set((state) => ({ showCode: !state.showCode })),
  setSelectedSection: (selectedSection) => set({ selectedSection }),
}));
