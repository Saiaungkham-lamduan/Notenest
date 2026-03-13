import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, Spacing, Radius } from '../../../core/theme';
import { TIMELINE } from '../../../core/constants';

function SkeletonItem({ delay }: { delay: number }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={[styles.chip, { width: 50 }]} />
      <View style={[styles.line, { width: '70%', height: 16 }]} />
      <View style={[styles.line, { width: '90%', height: 12 }]} />
      <View style={[styles.line, { width: '60%', height: 12 }]} />
    </Animated.View>
  );
}

export function SkeletonList() {
  return (
    <View style={styles.container}>
      {Array.from({ length: TIMELINE.SKELETON_COUNT }).map((_, i) => (
        <SkeletonItem key={i} delay={i * 100} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chip: {
    height: 12,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  line: {
    borderRadius: Radius.full,
    backgroundColor: Colors.border,
  },
});
