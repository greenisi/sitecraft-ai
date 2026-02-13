import { create } from 'zustand';

export interface SelectedElement {
  tagName: string;
  textContent: string;
  isTextEditable: boolean;
  cssPath: string;
  className: string;
  rect: { top: number; left: number; width: number; height: number };
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontWeight: string;
    fontFamily: string;
    lineHeight: string;
    letterSpacing: string;
    textAlign: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    borderRadius: string;
    borderColor: string;
    borderWidth: string;
    opacity: string;
    boxShadow: string;
    display: string;
    overflow: string;
    cursor: string;
  };
}

export type PendingChangeType = 'text' | 'style';

export interface PendingChange {
  id: string;
  type: PendingChangeType;
  cssPath: string;
  /** For text changes */
  oldText?: string;
  newText?: string;
  /** For style changes */
  property?: string;
  oldValue?: string;
  newValue?: string;
}

type PropertiesTab = 'style' | 'spacing' | 'typography' | 'effects';

interface VisualEditorState {
  // State
  isVisualEditorActive: boolean;
  selectedElement: SelectedElement | null;
  isInlineEditing: boolean;
  propertiesPanelTab: PropertiesTab;
  pendingChanges: PendingChange[];
  isSaving: boolean;

  // Derived
  hasUnsavedChanges: () => boolean;

  // Actions
  toggleVisualEditor: () => void;
  exitVisualEditor: () => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setInlineEditing: (editing: boolean) => void;
  setPropertiesPanelTab: (tab: PropertiesTab) => void;
  addPendingChange: (change: Omit<PendingChange, 'id'>) => void;
  clearPendingChanges: () => void;
  setSaving: (saving: boolean) => void;
}

let changeCounter = 0;

export const useVisualEditorStore = create<VisualEditorState>((set, get) => ({
  isVisualEditorActive: false,
  selectedElement: null,
  isInlineEditing: false,
  propertiesPanelTab: 'style',
  pendingChanges: [],
  isSaving: false,

  hasUnsavedChanges: () => get().pendingChanges.length > 0,

  toggleVisualEditor: () =>
    set((state) => ({
      isVisualEditorActive: !state.isVisualEditorActive,
      // Reset selection when toggling off
      ...(!state.isVisualEditorActive
        ? {}
        : { selectedElement: null, isInlineEditing: false }),
    })),

  exitVisualEditor: () =>
    set({
      isVisualEditorActive: false,
      selectedElement: null,
      isInlineEditing: false,
    }),

  setSelectedElement: (element) =>
    set({ selectedElement: element, isInlineEditing: false }),

  setInlineEditing: (editing) => set({ isInlineEditing: editing }),

  setPropertiesPanelTab: (tab) => set({ propertiesPanelTab: tab }),

  addPendingChange: (change) =>
    set((state) => {
      changeCounter++;
      const newChange: PendingChange = {
        ...change,
        id: `change-${changeCounter}-${Date.now()}`,
      };

      // For style changes on the same element+property, replace the old one
      if (change.type === 'style' && change.property) {
        const filtered = state.pendingChanges.filter(
          (c) =>
            !(
              c.type === 'style' &&
              c.cssPath === change.cssPath &&
              c.property === change.property
            )
        );
        return { pendingChanges: [...filtered, newChange] };
      }

      return { pendingChanges: [...state.pendingChanges, newChange] };
    }),

  clearPendingChanges: () => set({ pendingChanges: [] }),

  setSaving: (saving) => set({ isSaving: saving }),
}));
