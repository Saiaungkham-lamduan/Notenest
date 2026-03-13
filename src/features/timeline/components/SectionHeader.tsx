import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../../core/theme';
import { TimelineSection } from '../../../models/note';

interface SectionHeaderProps {
  label: string;
  section: TimelineSection;
  count: number;
}

const SECTION_ACCENTS: Record<TimelineSection, string> = {
  today: Colors.primary,
  tomorrow: Colors.warning,
  upcoming: Colors.success,
  past: Colors.textTertiary,
};

export function SectionHeader({ label, section, count }: SectionHeaderProps) {
  const accentColor = SECTION_ACCENTS[section];
  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: accentColor }]} />
      <Text style={[styles.label, { color: accentColor }]}>{label}</Text>
      <View style={styles.line} />
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semiBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  count: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    fontWeight: Typography.weight.medium,
  },
});
