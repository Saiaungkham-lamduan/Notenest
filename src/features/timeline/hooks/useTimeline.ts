import { useMemo } from 'react';
import { GroupedNotes } from '../../../models/note';
import { useNotesStore } from '../../notes/store/notesStore';
import { groupNotesBySection } from '../../../core/utils';

export function useTimeline(): {
  grouped: GroupedNotes[];
  isEmpty: boolean;
  isLoading: boolean;
} {
  const notes = useNotesStore((s) => s.notes);
  const isLoading = useNotesStore((s) => s.isLoading);

  const grouped = useMemo(() => groupNotesBySection(notes), [notes]);

  return {
    grouped,
    isEmpty: notes.length === 0,
    isLoading,
  };
}
