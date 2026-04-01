import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '../../src/features/notes/store/notesStore';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/core/theme';
import { STRINGS } from '../../src/core/constants';
import {
  formatDateForInput,
  formatTimeForInput,
} from '../../src/core/utils';

type Mode = 'add' | 'edit';

export default function AddEditNoteScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const noteId = params.id;
  const mode: Mode = noteId ? 'edit' : 'add';

  const addNote = useNotesStore((s) => s.addNote);
  const updateNote = useNotesStore((s) => s.updateNote);
  // ✅ Subscribe directly to the note for reactivity
  const existingNote = useNotesStore((s) =>
    noteId ? s.notes.find((n) => n.id === noteId) : undefined
  );

  // Form state
  const [title, setTitle] = useState(existingNote?.title ?? '');
  const [content, setContent] = useState(existingNote?.content ?? '');
  const [selectedDate, setSelectedDate] = useState<Date>(
    existingNote
      ? new Date(existingNote.timestamp)
      : (() => {
          const d = new Date();
          d.setMinutes(d.getMinutes() + 30, 0, 0);
          return d;
        })()
  );

  // ✅ FIX: Use a single modal approach for both iOS date and time
  // to avoid display="inline" Android incompatibility.
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const contentRef = useRef<TextInput>(null);

  const isValid = title.trim().length > 0 && selectedDate !== null;

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);

    try {
      const timestamp = selectedDate.toISOString();

      if (mode === 'add') {
        await addNote({
          title: title.trim(),
          content: content.trim(),
          timestamp,
          isCompleted: false,
        });
      } else if (noteId) {
        await updateNote(noteId, {
          title: title.trim(),
          content: content.trim(),
          timestamp,
        });
      }
      router.back();
    } catch (err) {
      console.error('[AddEdit] Save failed:', err);
      Alert.alert('Error', 'Failed to save note. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [isValid, isSaving, mode, title, content, selectedDate, noteId]);

  // ✅ FIX: Use platform-appropriate display modes
  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') return;
    if (date) {
      const merged = new Date(selectedDate);
      merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      setSelectedDate(merged);
    }
  };

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) {
      const merged = new Date(selectedDate);
      merged.setHours(date.getHours(), date.getMinutes());
      setSelectedDate(merged);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.card} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{STRINGS.CANCEL}</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {mode === 'add' ? STRINGS.ADD_NOTE : STRINGS.EDIT_NOTE}
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          disabled={!isValid || isSaving}
          style={[styles.saveBtn, (!isValid || isSaving) && styles.saveBtnDisabled]}
        >
          {isSaving ? (
            <ActivityIndicator color={Colors.textInverse} size="small" />
          ) : (
            <Text style={[styles.saveText, !isValid && styles.saveTextDisabled]}>
              {STRINGS.SAVE}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder={STRINGS.TITLE_PLACEHOLDER}
              placeholderTextColor={Colors.textTertiary}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={() => contentRef.current?.focus()}
              autoFocus
              maxLength={120}
            />
          </View>

          {/* Date & Time pickers */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Scheduled For *</Text>
            <View style={styles.dateTimeRow}>
              {Platform.OS === 'web' ? (
                <>
                  <input
                    type="date"
                    value={formatDateForInput(selectedDate)}
                    onChange={(e) => {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      const merged = new Date(selectedDate);
                      merged.setFullYear(year, month - 1, day);
                      setSelectedDate(merged);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      backgroundColor: '#F9FAFB',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="time"
                    value={formatTimeForInput(selectedDate)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const merged = new Date(selectedDate);
                      merged.setHours(hours, minutes);
                      setSelectedDate(merged);
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      border: '1px solid #E5E7EB',
                      fontSize: 14,
                      backgroundColor: '#F9FAFB',
                      cursor: 'pointer',
                    }}
                  />
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.pickerChip, Shadows.sm]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={styles.pickerChipIcon}>📅</Text>
                    <Text style={styles.pickerChipText}>
                      {selectedDate.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerChip, Shadows.sm]}
                    onPress={() => setShowTimePicker(true)}
                  >
                    <Text style={styles.pickerChipIcon}>⏰</Text>
                    <Text style={styles.pickerChipText}>
                      {selectedDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={[styles.fieldGroup, styles.flex]}>
            <Text style={styles.fieldLabel}>Content</Text>
            <TextInput
              ref={contentRef}
              style={styles.contentInput}
              placeholder={STRINGS.CONTENT_PLACEHOLDER}
              placeholderTextColor={Colors.textTertiary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              returnKeyType="default"
              // ✅ FIX: Input validation — limit content length to prevent oversized payloads
              maxLength={2000}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ✅ FIX: Android — use "default" (calendar/spinner) display mode */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate}
          mode="time"
          display="default"
          onChange={(event, date) => {
            setShowTimePicker(false);
            if (event.type === 'dismissed') return;
            if (date) {
              const merged = new Date(selectedDate);
              merged.setHours(date.getHours(), date.getMinutes());
              setSelectedDate(merged);
            }
          }}
          is24Hour={false}
        />
      )}

      {/* ✅ FIX: iOS — wrap both date and time in a modal for consistent layout */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalToolbar}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) {
                    const merged = new Date(selectedDate);
                    merged.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    setSelectedDate(merged);
                  }
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {showTimePicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalToolbar}>
                <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                  <Text style={styles.modalDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={selectedDate}
                mode="time"
                display="spinner"
                onChange={handleTimeChange}
                is24Hour={false}
              />
            </View>
          </View>
        </Modal>
      )}
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
  cancelBtn: {
    padding: Spacing.xs,
    minWidth: 60,
  },
  cancelText: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: Colors.border,
  },
  saveText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textInverse,
  },
  saveTextDisabled: {
    color: Colors.textTertiary,
  },
  formContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  fieldGroup: {
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleInput: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  pickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerChipIcon: {
    fontSize: 16,
  },
  pickerChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
  },
  contentInput: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.6,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  // Modal styles for iOS pickers
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalSheet: {
    backgroundColor: Colors.card,
    paddingBottom: Spacing.lg,
  },
  modalToolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalDoneText: {
    color: Colors.primary,
    fontWeight: Typography.weight.semiBold,
    fontSize: Typography.size.md,
  },
});
