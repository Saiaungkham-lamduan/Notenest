import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  SectionList,
  StyleSheet,
  StatusBar,
  Text,
  AppState,
  AppStateStatus,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotesStore } from '../../src/features/notes/store/notesStore';
import { useTimeline } from '../../src/features/timeline/hooks/useTimeline';
import { NoteCard } from '../../src/features/timeline/components/NoteCard';
import { SectionHeader } from '../../src/features/timeline/components/SectionHeader';
import { FAB } from '../../src/features/timeline/components/FAB';
import { SkeletonList } from '../../src/features/timeline/components/SkeletonList';
import { EmptyState } from '../../src/features/timeline/components/EmptyState';
import { Colors, Typography, Spacing } from '../../src/core/theme';
import { STRINGS } from '../../src/core/constants';
import { GroupedNotes, Note } from '../../src/models/note';

export default function TimelineScreen() {
  const { grouped, isEmpty, isLoading } = useTimeline();
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const highlightedNoteId = useNotesStore((s) => s.highlightedNoteId);
  const appState = useRef(AppState.currentState);

  // Initial load
  useEffect(() => {
    loadNotes();
  }, []);

  // Refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          loadNotes();
        }
        appState.current = nextState;
      }
    );
    return () => sub.remove();
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Note }) => (
      <NoteCard
        note={item}
        isHighlighted={highlightedNoteId === item.id}
      />
    ),
    [highlightedNoteId]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: GroupedNotes }) => (
      <SectionHeader
        label={section.label}
        section={section.section}
        count={section.data.length}
      />
    ),
    []
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{STRINGS.APP_NAME}</Text>
        </View>
        <SkeletonList />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{STRINGS.APP_NAME}</Text>
      </View>

      {isEmpty ? (
        <EmptyState
          title={STRINGS.EMPTY_TIMELINE_TITLE}
          subtitle={STRINGS.EMPTY_TIMELINE_SUBTITLE}
          icon="🗓️"
        />
      ) : (
        <SectionList
          sections={grouped}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}

      <FAB onPress={() => router.push('/note/add')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  listContent: {
    paddingBottom: 120, // space for FAB
  },
});
