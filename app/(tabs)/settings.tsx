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

const STORAGE_KEY_NOTIFICATIONS = '@notenest/notifications_enabled';
const STORAGE_KEY_DARK_MODE = '@notenest/dark_mode_enabled';

interface SettingRowProps {
  label: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (v: boolean) => void;
  disabled?: boolean;
  children?: React.ReactNode;
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
    } catch {}
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
    // Full dark mode implementation: emit event / update theme context
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.content}>
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
  version: {
    textAlign: 'center',
    marginTop: Spacing['2xl'],
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
});
