import { create } from 'zustand';
import { Note, NoteInput } from '../../../models/note';
import {
  fetchAllNotes,
  insertNote,
  updateNoteById,
  deleteNoteById,
} from '../../../services/database';
import {
  scheduleNoteNotification,
  cancelNoteNotification,
} from '../../../services/notifications';

interface NotesState {
  notes: Note[];
  isLoading: boolean;
  isSyncing: boolean;
  highlightedNoteId: string | null;

  loadNotes: () => Promise<void>;
  addNote: (input: NoteInput) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  highlightNote: (id: string, durationMs?: number) => void;
  clearHighlight: () => void;
  getNoteById: (id: string) => Note | undefined;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  isLoading: false,
  isSyncing: false,
  highlightedNoteId: null,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const notes = await fetchAllNotes();
      set({ notes, isLoading: false });
    } catch (err) {
      // ✅ FIX: Only log errors in development — no stack traces in production
      if (__DEV__) console.error('[Store] loadNotes failed:', err);
      set({ isLoading: false });
    }
  },

  addNote: async (input: NoteInput) => {
    const note = await insertNote(input);

    set((state) => {
      const next = [...state.notes, note].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return { notes: next };
    });

    // ✅ FIX: DEV-only error logging
    scheduleNoteNotification(note).catch((err) => {
      if (__DEV__) console.error('[Store] scheduleNoteNotification failed:', err);
    });

    return note;
  },

  updateNote: async (id, updates) => {
    const updated = await updateNoteById(id, updates);

    set((state) => {
      const next = state.notes
        .map((n) => (n.id === id ? updated : n))
        .sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
      return { notes: next };
    });

    if (updates.timestamp) {
      await cancelNoteNotification(id);
      scheduleNoteNotification(updated).catch((err) => {
        if (__DEV__) console.error('[Store] rescheduleNotification failed:', err);
      });
    }
  },

  deleteNote: async (id: string) => {
    await deleteNoteById(id);
    await cancelNoteNotification(id);
    set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
  },

  toggleComplete: async (id: string) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;

    const isCompleted = !note.isCompleted;
    await updateNoteById(id, { isCompleted });

    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, isCompleted } : n)),
    }));

    if (isCompleted) {
      await cancelNoteNotification(id);
    } else {
      const updated = get().notes.find((n) => n.id === id);
      if (updated) {
        scheduleNoteNotification(updated).catch((err) => {
          if (__DEV__) console.error('[Store] rescheduleOnUncomplete failed:', err);
        });
      }
    }
  },

  highlightNote: (id: string, durationMs = 5000) => {
    set({ highlightedNoteId: id });
    setTimeout(() => {
      set({ highlightedNoteId: null });
    }, durationMs);
  },

  clearHighlight: () => set({ highlightedNoteId: null }),

  getNoteById: (id: string) => get().notes.find((n) => n.id === id),
}));
