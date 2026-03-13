import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, NoteInput } from '../models/note';
import { generateId } from '../core/utils';

const NOTES_KEY = '@notenest/notes';

async function readNotes(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Note[];
  } catch {
    return [];
  }
}

async function writeNotes(notes: Note[]): Promise<void> {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function initDatabase(): Promise<void> {}

export async function fetchAllNotes(): Promise<Note[]> {
  const notes = await readNotes();
  return notes.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

export async function insertNote(input: NoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: generateId(),
    title: input.title,
    content: input.content,
    timestamp: input.timestamp,
    isCompleted: input.isCompleted ?? false,
    createdAt: now,
    updatedAt: now,
  };
  const notes = await readNotes();
  await writeNotes([...notes, note]);
  return note;
}

export async function updateNoteById(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<Note> {
  const notes = await readNotes();
  const index = notes.findIndex((n) => n.id === id);
  if (index === -1) throw new Error(`Note ${id} not found`);
  const updated: Note = { ...notes[index], ...updates, updatedAt: new Date().toISOString() };
  notes[index] = updated;
  await writeNotes(notes);
  return updated;
}

export async function deleteNoteById(id: string): Promise<void> {
  const notes = await readNotes();
  await writeNotes(notes.filter((n) => n.id !== id));
}

export async function fetchNoteById(id: string): Promise<Note | null> {
  const notes = await readNotes();
  return notes.find((n) => n.id === id) ?? null;
}