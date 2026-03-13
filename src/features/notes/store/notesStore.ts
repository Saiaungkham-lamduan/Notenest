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
      console.error('[Store] loadNotes failed:', err);
      set({ isLoading: false });
    }
  },

  addNote: async (input: NoteInput) => {
    const note = await insertNote(input);

    // Insert into sorted position
    set((state) => {
      const next = [...state.notes, note].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      return { notes: next };
    });

    // Fire and forget notification scheduling
    scheduleNoteNotification(note).catch(console.error);

    return note;
  },

  updateNote: async (id, updates) => {
    const updated = await updateNoteById(id, updates);

    set((state) => {
      const next = state.notes
        .map((n) => (n.id === id ? updated : n))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      return { notes: next };
    });

    // Reschedule notification if timestamp changed
    if (updates.timestamp) {
      await cancelNoteNotification(id);
      scheduleNoteNotification(updated).catch(console.error);
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

    // Cancel notification when completed
    if (isCompleted) {
      await cancelNoteNotification(id);
    } else {
      const updated = get().notes.find((n) => n.id === id);
      if (updated) scheduleNoteNotification(updated).catch(console.error);
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
