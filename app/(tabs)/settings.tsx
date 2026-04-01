import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../src/core/theme';
import { STRINGS } from '../../src/core/constants';
import { requestNotificationPermissions } from '../../src/services/notifications';
import { useNotesStore } from '../../src/features/notes/store/notesStore';

const STORAGE_KEY_NOTIFICATIONS = '@notenest/notifications_enabled';
const STORAGE_KEY_DARK_MODE = '@notenest/dark_mode_enabled';

interface SettingRowProps {
  label: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
}

function SettingRow({
  label,
  subtitle,
  value,
  onValueChange,
  disabled = false,
}: SettingRowProps) {
  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, disabled && styles.disabledText]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        )}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{
            false: Colors.border,
            true: Colors.primary,
          }}
          thumbColor={Colors.card}
          ios_backgroundColor={Colors.border}
        />
      ) : (
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>Soon</Text>
        </View>
      )}
    </View>
  );
}

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // ✅ Access the store's reset action to clear notes from memory too
  const clearAllNotes = useNotesStore((s) => s.loadNotes);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const [notif, dark] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_NOTIFICATIONS),
        AsyncStorage.getItem(STORAGE_KEY_DARK_MODE),
      ]);
      if (notif !== null) setNotificationsEnabled(notif === 'true');
      if (dark !== null) setDarkModeEnabled(dark === 'true');
    } catch (err) {
      if (__DEV__) console.error('[Settings] loadPreferences failed:', err);
    }
  }

  async function handleNotificationsToggle(value: boolean) {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Blocked',
          'Please enable notifications in your device settings.'
        );
        return;
      }
    }
    setNotificationsEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEY_NOTIFICATIONS, String(value));
  }

  async function handleDarkModeToggle(value: boolean) {
    setDarkModeEnabled(value);
    await AsyncStorage.setItem(STORAGE_KEY_DARK_MODE, String(value));
  }

  // ✅ FIX: Delete All Data — PDPA Right to Erasure
  function handleDeleteAllData() {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete ALL your notes and app preferences. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all AsyncStorage keys belonging to NoteNest
              await AsyncStorage.multiRemove([
                '@notenest/notes',
                STORAGE_KEY_NOTIFICATIONS,
                STORAGE_KEY_DARK_MODE,
                '@notenest/consent_given',
              ]);
              // Reset in-memory Zustand store
              useNotesStore.setState({ notes: [], isLoading: false });
              Alert.alert(
                'All Data Deleted',
                'All your notes and preferences have been permanently removed from this device.'
              );
            } catch (err) {
              if (__DEV__) console.error('[Settings] deleteAllData failed:', err);
              Alert.alert('Error', 'Could not delete data. Please try again.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* ── PREFERENCES ── */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>

        <View style={[styles.card, Shadows.sm]}>
          <SettingRow
            label={STRINGS.SETTINGS_NOTIFICATIONS}
            subtitle="Get reminded when notes are scheduled"
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
          />
          <View style={styles.divider} />
          <SettingRow
            label={STRINGS.SETTINGS_DARK_MODE}
            subtitle="Switch to dark appearance"
            value={darkModeEnabled}
            onValueChange={handleDarkModeToggle}
          />
        </View>

        {/* ── ACCOUNT ── */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
          ACCOUNT
        </Text>

        <View style={[styles.card, Shadows.sm]}>
          <SettingRow
            label={STRINGS.SETTINGS_CLOUD_SYNC}
            subtitle={STRINGS.SETTINGS_CLOUD_SYNC_SUBTITLE}
            disabled
          />
        </View>

        {/* ── PRIVACY ── */}
        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>
          PRIVACY
        </Text>

        <View style={[styles.card, Shadows.sm]}>
          {/* ✅ FIX: Delete All Data button for PDPA Right to Erasure */}
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAllData}>
            <View style={styles.rowText}>
              <Text style={styles.dangerLabel}>Delete All Data</Text>
              <Text style={styles.rowSubtitle}>
                Permanently remove all notes and preferences from this device
              </Text>
            </View>
            <Text style={styles.dangerArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyNoteText}>
            🔒 All your notes are stored only on this device. Nothing is uploaded to any server.
          </Text>
        </View>

        <Text style={styles.version}>NoteNest v1.0.0</Text>
      </View>
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
  content: {
    padding: Spacing.md,
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  disabledText: {
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginLeft: Spacing.md,
  },
  comingSoon: {
    backgroundColor: Colors.divider,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  comingSoonText: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
  // ✅ Danger row for Delete All Data
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dangerLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    color: Colors.danger,
    marginBottom: 2,
  },
  dangerArrow: {
    fontSize: Typography.size.xl,
    color: Colors.danger,
    fontWeight: Typography.weight.medium,
  },
  privacyNote: {
    marginTop: Spacing.md,
    backgroundColor: Colors.successLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  privacyNoteText: {
    fontSize: Typography.size.sm,
    color: Colors.success,
    lineHeight: Typography.size.sm * 1.5,
  },
  version: {
    textAlign: 'center',
    marginTop: Spacing['2xl'],
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
});
