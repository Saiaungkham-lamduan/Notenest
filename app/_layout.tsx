import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View, Text, StyleSheet, Animated } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import { initDatabase } from '../src/services/database';
import {
  setupNotificationChannel,
  requestNotificationPermissions,
  addNotificationResponseListener,
  addNotificationReceivedListener,
} from '../src/services/notifications';
import { useNotesStore } from '../src/features/notes/store/notesStore';
import { Colors, Typography, Spacing } from '../src/core/theme';
import { STRINGS, ROUTES, TIMELINE } from '../src/core/constants';

export default function RootLayout() {
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const highlightNote = useNotesStore((s) => s.highlightNote);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const offlineBannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bootstrap();
  }, []);

  async function bootstrap() {
    try {
      await initDatabase();
      await Promise.all([
        setupNotificationChannel(),
        requestNotificationPermissions(),
      ]);
      await loadNotes();
    } catch (err) {
      console.error('[Bootstrap] Failed:', err);
    } finally {
      setIsBootstrapping(false);
    }
  }

  // Handle notification tap → navigate to note
  useEffect(() => {
    const responseSub = addNotificationResponseListener((noteId: string) => {
      router.push(`/note/${noteId}`);
    });

    // Handle foreground notification → highlight note
    const receivedSub = addNotificationReceivedListener((noteId: string) => {
      highlightNote(noteId, TIMELINE.HIGHLIGHT_DURATION_MS);
    });

    return () => {
      responseSub.remove();
      receivedSub.remove();
    };
  }, []);

  if (isBootstrapping) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>{STRINGS.APP_NAME}</Text>
        <Text style={styles.splashSub}>Loading your notes...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen
          name="note/add"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="note/[id]"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  splashTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.primary,
    letterSpacing: -1,
  },
  splashSub: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
  },
  offlineBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.warning,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    zIndex: 9999,
  },
  offlineBannerText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textInverse,
  },
});
