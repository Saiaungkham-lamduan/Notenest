import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '../../src/features/notes/store/notesStore';
import { NoteCard } from '../../src/features/timeline/components/NoteCard';
import { EmptyState } from '../../src/features/timeline/components/EmptyState';
import { Colors, Typography, Spacing, Radius } from '../../src/core/theme';
import { STRINGS } from '../../src/core/constants';
import { filterNotesByQuery } from '../../src/core/utils';
import { Note } from '../../src/models/note';

export default function SearchScreen() {
  const notes = useNotesStore((s) => s.notes);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => filterNotesByQuery(notes, query),
    [notes, query]
  );

  const renderItem = ({ item }: { item: Note }) => (
    <NoteCard note={item} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={STRINGS.SEARCH_PLACEHOLDER}
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </View>
      </View>

      {query.length === 0 ? (
        <EmptyState
          title="Find your notes"
          subtitle="Search by title or content."
          icon="🔍"
        />
      ) : results.length === 0 ? (
        <EmptyState
          title={STRINGS.EMPTY_SEARCH_TITLE}
          subtitle={STRINGS.EMPTY_SEARCH_SUBTITLE}
          icon="😕"
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  searchWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    height: 32,
  },
  resultCount: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
});
