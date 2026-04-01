import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import ConsentScreen from './consent';

const CONSENT_KEY = '@notenest/consent_given';

export default function RootLayout() {
  const loadNotes = useNotesStore((s) => s.loadNotes);
  const highlightNote = useNotesStore((s) => s.highlightNote);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  // ✅ FIX: Track whether the user has accepted the privacy consent
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

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

      // Check if user has already given consent
      const consent = await AsyncStorage.getItem(CONSENT_KEY);
      setConsentGiven(consent === 'true');
    } catch (err) {
      // ✅ FIX: Only log errors in development, not production
      if (__DEV__) console.error('[Bootstrap] Failed:', err);
    } finally {
      setIsBootstrapping(false);
    }
  }

  async function handleConsentAccepted() {
    await AsyncStorage.setItem(CONSENT_KEY, 'true');
    setConsentGiven(true);
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

  // Show splash while bootstrapping
  if (isBootstrapping || consentGiven === null) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>{STRINGS.APP_NAME}</Text>
        <Text style={styles.splashSub}>Loading your notes...</Text>
      </View>
    );
  }

  // ✅ FIX: Show consent screen on first launch before app content
  if (!consentGiven) {
    return <ConsentScreen onAccept={handleConsentAccepted} />;
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
});
