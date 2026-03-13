import { GroupedNotes, Note, TimelineSection } from '../models/note';

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

export function isPast(date: Date): boolean {
  return date < new Date();
}

export function getSection(timestamp: string): TimelineSection {
  const date = new Date(timestamp);
  if (isToday(date)) return 'today';
  if (isTomorrow(date)) return 'tomorrow';
  if (isPast(date)) return 'past';
  return 'upcoming';
}

const SECTION_ORDER: TimelineSection[] = ['past', 'today', 'tomorrow', 'upcoming'];

const SECTION_LABELS: Record<TimelineSection, string> = {
  past: 'Past',
  today: 'Today',
  tomorrow: 'Tomorrow',
  upcoming: 'Upcoming',
};

export function groupNotesBySection(notes: Note[]): GroupedNotes[] {
  const groups: Record<TimelineSection, Note[]> = {
    past: [],
    today: [],
    tomorrow: [],
    upcoming: [],
  };

  for (const note of notes) {
    const section = getSection(note.timestamp);
    groups[section].push(note);
  }

  return SECTION_ORDER.filter((s) => groups[s].length > 0).map((section) => ({
    section,
    label: SECTION_LABELS[section],
    data: groups[section],
  }));
}

export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatFullDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateForInput(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function formatTimeForInput(date: Date): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

export function combineDateAndTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

export function filterNotesByQuery(notes: Note[], query: string): Note[] {
  const lower = query.toLowerCase().trim();
  if (!lower) return notes;
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(lower) ||
      n.content.toLowerCase().includes(lower)
  );
}
