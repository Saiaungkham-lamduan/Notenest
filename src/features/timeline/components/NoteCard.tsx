import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Note } from '../../../models/note';
import { Colors, Typography, Spacing, Radius, Shadows, Animation } from '../../../core/theme';
import { STRINGS } from '../../../core/constants';
import { formatTimestamp, formatFullDate, isToday, isTomorrow } from '../../../core/utils';
import { useNotesStore } from '../../notes/store/notesStore';

const SWIPE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

interface NoteCardProps {
  note: Note;
  isHighlighted?: boolean;
}

export function NoteCard({ note, isHighlighted = false }: NoteCardProps) {
  const toggleComplete = useNotesStore((s) => s.toggleComplete);
  const deleteNote = useNotesStore((s) => s.deleteNote);

  const translateX = useRef(new Animated.Value(0)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const swipeDirection = useRef<'left' | 'right' | null>(null);

  const animateBack = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: Animation.normal,
      useNativeDriver: true,
    }).start();
  }, [translateX, backgroundOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,

      onPanResponderGrant: () => {
        translateX.setOffset((translateX as any)._value);
        translateX.setValue(0);
      },

      onPanResponderMove: (_, g) => {
        translateX.setValue(g.dx);
        swipeDirection.current = g.dx > 0 ? 'right' : 'left';
        const progress = Math.min(Math.abs(g.dx) / SWIPE_THRESHOLD, 1);
        backgroundOpacity.setValue(progress);
      },

      onPanResponderRelease: (_, g) => {
        translateX.flattenOffset();
        const isFullSwipe =
          Math.abs(g.dx) > SWIPE_THRESHOLD ||
          Math.abs(g.vx) > SWIPE_VELOCITY_THRESHOLD;

        if (isFullSwipe && g.dx > 0) {
          // Swipe right → complete
          Animated.timing(translateX, {
            toValue: 400,
            duration: Animation.normal,
            useNativeDriver: true,
          }).start(() => {
            toggleComplete(note.id);
            translateX.setValue(0);
            backgroundOpacity.setValue(0);
          });
        } else if (isFullSwipe && g.dx < 0) {
          // Swipe left → delete (with confirm)
          animateBack();
          Alert.alert(
            STRINGS.DELETE_CONFIRM_TITLE,
            STRINGS.DELETE_CONFIRM_MESSAGE,
            [
              { text: STRINGS.DELETE_CONFIRM_CANCEL, style: 'cancel' },
              {
                text: STRINGS.DELETE_CONFIRM_OK,
                style: 'destructive',
                onPress: () => deleteNote(note.id),
              },
            ]
          );
        } else {
          animateBack();
        }
      },

      onPanResponderTerminate: () => animateBack(),
    })
  ).current;

  const date = new Date(note.timestamp);
  const isNoteToday = isToday(date);
  const isNoteTomorrow = isTomorrow(date);

  const swipeRightBg = translateX.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [Colors.successLight, Colors.success],
    extrapolate: 'clamp',
  });
  const swipeLeftBg = translateX.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [Colors.danger, Colors.dangerLight],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Swipe right background */}
      <Animated.View
        style={[
          styles.swipeBg,
          styles.swipeRightBg,
          { backgroundColor: swipeRightBg, opacity: backgroundOpacity },
        ]}
      >
        <Text style={styles.swipeLabel}>✓</Text>
      </Animated.View>

      {/* Swipe left background */}
      <Animated.View
        style={[
          styles.swipeBg,
          styles.swipeLeftBg,
          { backgroundColor: swipeLeftBg, opacity: backgroundOpacity },
        ]}
      >
        <Text style={styles.swipeLabel}>✕</Text>
      </Animated.View>

      <Animated.View
        style={[{ transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push(`/note/${note.id}`)}
          style={[
            styles.card,
            note.isCompleted && styles.completedCard,
            isHighlighted && styles.highlightedCard,
            Shadows.sm,
          ]}
        >
          <View style={styles.timeRow}>
            <Text style={styles.time}>{formatTimestamp(note.timestamp)}</Text>
            {!isNoteToday && !isNoteTomorrow && (
              <Text style={styles.dateChip}>
                {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </Text>
            )}
            {note.isCompleted && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Done</Text>
              </View>
            )}
          </View>

          <Text
            style={[styles.title, note.isCompleted && styles.completedText]}
            numberOfLines={1}
          >
            {note.title}
          </Text>

          {note.content.trim().length > 0 && (
            <Text
              style={[styles.preview, note.isCompleted && styles.completedText]}
              numberOfLines={2}
            >
              {note.content}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  swipeBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  swipeRightBg: {
    left: 0,
    right: 0,
    alignItems: 'flex-start',
  },
  swipeLeftBg: {
    left: 0,
    right: 0,
    alignItems: 'flex-end',
  },
  swipeLabel: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: Colors.card,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  completedCard: {
    opacity: 0.5,
  },
  highlightedCard: {
    backgroundColor: Colors.highlight,
    borderColor: Colors.primary,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  time: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    color: Colors.primary,
  },
  dateChip: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  completedBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  completedBadgeText: {
    fontSize: Typography.size.xs,
    color: Colors.success,
    fontWeight: Typography.weight.semiBold,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  preview: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.size.sm * 1.5,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
});
