import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Note, NoteInput } from '../models/note';

const NOTES_COLLECTION = 'notes';

// No initialisation needed for Firestore
export async function initDatabase(): Promise<void> {}

export async function fetchAllNotes(): Promise<Note[]> {
  try {
    const q = query(
      collection(db, NOTES_COLLECTION),
      orderBy('timestamp', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Note));
  } catch (err) {
    if (__DEV__) console.error('[Firestore] fetchAllNotes failed:', err);
    return [];
  }
}

export async function insertNote(input: NoteInput): Promise<Note> {
  const now = new Date().toISOString();
  const noteData = {
    title: input.title,
    content: input.content,
    timestamp: input.timestamp,
    isCompleted: input.isCompleted ?? false,
    createdAt: now,
    updatedAt: now,
  };
  try {
    const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteData);
    return { id: docRef.id, ...noteData };
  } catch (err) {
    if (__DEV__) console.error('[Firestore] insertNote failed:', err);
    throw err;
  }
}

export async function updateNoteById(
  id: string,
  updates: Partial<Omit<Note, 'id' | 'createdAt'>>
): Promise<Note> {
  try {
    const ref = doc(db, NOTES_COLLECTION, id);
    const updatedFields = { ...updates, updatedAt: new Date().toISOString() };
    await updateDoc(ref, updatedFields);
    const snap = await getDoc(ref);
    return { id: snap.id, ...snap.data() } as Note;
  } catch (err) {
    if (__DEV__) console.error('[Firestore] updateNoteById failed:', err);
    throw err;
  }
}

export async function deleteNoteById(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, NOTES_COLLECTION, id));
  } catch (err) {
    if (__DEV__) console.error('[Firestore] deleteNoteById failed:', err);
    throw err;
  }
}

export async function fetchNoteById(id: string): Promise<Note | null> {
  try {
    const snap = await getDoc(doc(db, NOTES_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Note;
  } catch (err) {
    if (__DEV__) console.error('[Firestore] fetchNoteById failed:', err);
    return null;
  }
}
