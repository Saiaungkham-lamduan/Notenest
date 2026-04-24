import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius, Shadows } from '../src/core/theme';

interface ConsentScreenProps {
  onAccept: () => void;
}

export default function ConsentScreen({ onAccept }: ConsentScreenProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  function handleScroll({ nativeEvent }: any) {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) setScrolledToBottom(true);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.title}>Privacy Notice</Text>
        <Text style={styles.subtitle}>Please read before using NoteNest</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={true}
      >
        <Section title="What data we collect">
          NoteNest collects only what you type: note titles, note content, and
          the date and time you schedule each note.
        </Section>

        <Section title="Where your data is stored">
          All data is stored exclusively on your device using AsyncStorage. It
          is never uploaded to a server, shared with third parties, or sent
          anywhere outside your phone.
        </Section>

        <Section title="Why we collect it">
          Your note titles and content are stored so you can view and manage
          your notes. Timestamps are used to sort notes on the timeline and to
          schedule reminders.
        </Section>

        <Section title="Notification permission">
          If you enable notifications in Settings, NoteNest will request
          permission to send you reminders at the time you schedule each note.
          You can revoke this at any time in your device Settings.
        </Section>

        <Section title="Your rights (PDPA)">
          You have the right to access, correct, and delete all data stored by
          this app. To delete all your data at any time, go to Settings and
          tap{' '}
          <Text style={styles.emphasis}>Delete All Data</Text>. This
          permanently removes every note and preference.
        </Section>

        <Section title="No analytics, no ads">
          NoteNest contains no analytics SDKs, no advertising networks, and no
          third-party tracking of any kind.
        </Section>

        <View style={styles.scrollHint}>
          {!scrolledToBottom && (
            <Text style={styles.scrollHintText}>↓ Scroll to read all</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.acceptBtn,
            !scrolledToBottom && styles.acceptBtnDisabled,
          ]}
          onPress={onAccept}
          disabled={!scrolledToBottom}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>
            {scrolledToBottom
              ? 'I understand — Continue to NoteNest'
              : 'Scroll to read the full notice'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          By continuing you agree that your notes are stored locally on this
          device as described above.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <Text style={sectionStyles.body}>{children}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
    lineHeight: Typography.size.md * 1.6,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  emoji: {
    fontSize: 40,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  scrollHint: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  scrollHintText: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
  },
  emphasis: {
    fontWeight: Typography.weight.semiBold,
    color: Colors.primary,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.card,
    gap: Spacing.sm,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: Colors.border,
  },
  acceptBtnText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semiBold,
    color: Colors.textInverse,
  },
  footerNote: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: Typography.size.sm * 1.5,
  },
});
