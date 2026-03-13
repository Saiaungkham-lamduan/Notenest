import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '../../src/features/notes/store/notesStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/core/theme';
import { STRINGS } from '../../src/core/constants';
import { formatTimestamp, formatFullDate, getSection } from '../../src/core/utils';
import { Note } from '../../src/models/note';

const SECTION_COLORS = {
  today: Colors.primary,
  tomorrow: Colors.warning,
  upcoming: Colors.success,
  past: Colors.textTertiary,
};

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const getNoteById = useNotesStore((s) => s.getNoteById);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const toggleComplete = useNotesStore((s) => s.toggleComplete);

  const note = getNoteById(id);

  useEffect(() => {
    if (!note) {
      router.back();
    }
  }, [note]);

  if (!note) return null;

  const section = getSection(note.timestamp);
  const sectionColor = SECTION_COLORS[section];

  async function handleDelete() {
    Alert.alert(
      STRINGS.DELETE_CONFIRM_TITLE,
      STRINGS.DELETE_CONFIRM_MESSAGE,
      [
        { text: STRINGS.DELETE_CONFIRM_CANCEL, style: 'cancel' },
        {
          text: STRINGS.DELETE_CONFIRM_OK,
          style: 'destructive',
          onPress: async () => {
            await deleteNote(id);
            router.back();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push(`/note/add?id=${id}`)}
          style={styles.editBtn}
        >
          <Text style={styles.editText}>{STRINGS.EDIT}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section badge */}
        <View style={[styles.sectionBadge, { backgroundColor: `${sectionColor}18` }]}>
          <View style={[styles.sectionDot, { backgroundColor: sectionColor }]} />
          <Text style={[styles.sectionText, { color: sectionColor }]}>
            {STRINGS[`SECTION_${section.toUpperCase()}` as keyof typeof STRINGS] ?? section}
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, note.isCompleted && styles.completedTitle]}>
          {note.title}
        </Text>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Text style={styles.timestampDate}>{formatFullDate(note.timestamp)}</Text>
          <Text style={styles.timestampSep}> · </Text>
          <Text style={styles.timestampTime}>{formatTimestamp(note.timestamp)}</Text>
        </View>

        {/* Status */}
        {note.isCompleted && (
          <View style={[styles.statusBanner, { backgroundColor: Colors.successLight }]}>
            <Text style={[styles.statusText, { color: Colors.success }]}>
              ✓ Completed
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Content */}
        {note.content.trim().length > 0 ? (
          <Text style={styles.body}>{note.content}</Text>
        ) : (
          <Text style={styles.emptyContent}>No content added.</Text>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, Shadows.md]}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            note.isCompleted ? styles.undoBtn : styles.completeBtn,
          ]}
          onPress={() => toggleComplete(id)}
        >
          <Text style={styles.actionBtnText}>
            {note.isCompleted ? '↩ Mark Incomplete' : '✓ Mark Complete'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={handleDelete}
        >
          <Text style={[styles.actionBtnText, { color: Colors.danger }]}>
            {STRINGS.DELETE}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  backText: {
    fontSize: Typography.size.md,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  editBtn: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  editText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: Spacing.xs,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    lineHeight: Typography.size['3xl'] * 1.2,
    letterSpacing: -0.5,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: Colors.textSecondary,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestampDate: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },
  timestampSep: {
    color: Colors.textTertiary,
  },
  timestampTime: {
    fontSize: Typography.size.sm,
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
  },
  statusBanner: {
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
  },
  body: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.7,
  },
  emptyContent: {
    fontSize: Typography.size.md,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  completeBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  undoBtn: {
    backgroundColor: Colors.background,
    borderColor: Colors.border,
  },
  deleteBtn: {
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger + '40',
  },
  actionBtnText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textInverse,
  },
});
