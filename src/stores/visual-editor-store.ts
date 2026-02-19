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
    fontStyle: string;
    textDecoration: string;
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
    borderStyle: string;
    width: string;
    height: string;
    maxWidth: string;
    minHeight: string;
    opacity: string;
    boxShadow: string;
    display: string;
    overflow: string;
    cursor: string;
  };
  href?: string;
  target?: string;
  title?: string;
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

type PropertiesTab = 'style' | 'spacing' | 'typography' | 'effects' | 'link';

interface VisualEditorState {
  // State
  isVisualEditorActive: boolean;
  selectedElement: SelectedElement | null;
  isInlineEditing: boolean;
  propertiesPanelTab: PropertiesTab;
  pendingChanges: PendingChange[];
  isSaving: boolean;

  // Undo/Redo
  undoStack: PendingChange[][];
  redoStack: PendingChange[][];

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
  undo: () => void;
  redo: () => void;
}

let changeCounter = 0;

export const useVisualEditorStore = create<VisualEditorState>((set, get) => ({
  isVisualEditorActive: false,
  selectedElement: null,
  isInlineEditing: false,
  propertiesPanelTab: 'style',
  pendingChanges: [],
  isSaving: false,
  undoStack: [],
  redoStack: [],

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

      // Push current state to undo stack before mutation
      const newUndoStack = [...state.undoStack, [...state.pendingChanges]];

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
        return {
          pendingChanges: [...filtered, newChange],
          undoStack: newUndoStack,
          redoStack: [],
        };
      }

      return {
        pendingChanges: [...state.pendingChanges, newChange],
        undoStack: newUndoStack,
        redoStack: [],
      };
    }),

  clearPendingChanges: () =>
    set({ pendingChanges: [], undoStack: [], redoStack: [] }),

  setSaving: (saving) => set({ isSaving: saving }),

  undo: () =>
    set((state) => {
      if (state.undoStack.length === 0) return state;
      const newUndoStack = [...state.undoStack];
      const previousState = newUndoStack.pop()!;
      return {
        undoStack: newUndoStack,
        redoStack: [...state.redoStack, [...state.pendingChanges]],
        pendingChanges: previousState,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return state;
      const newRedoStack = [...state.redoStack];
      const nextState = newRedoStack.pop()!;
      return {
        redoStack: newRedoStack,
        undoStack: [...state.undoStack, [...state.pendingChanges]],
        pendingChanges: nextState,
      };
    }),
}));
