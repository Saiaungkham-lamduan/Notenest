export interface Note {
  id: string;
  title: string;
  content: string;
  timestamp: string; // ISO 8601 — the scheduled time
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
}

export type NoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'>;

export type TimelineSection = 'past' | 'today' | 'tomorrow' | 'upcoming';

export interface GroupedNotes {
  section: TimelineSection;
  label: string;
  data: Note[];
}
