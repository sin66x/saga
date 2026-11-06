import { router } from 'expo-router';
import { type ReactNode, use } from 'react';
import { ScrollView, type ScrollViewProps, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { space } from '@/theme/tokens';
import { AppText } from './AppText';
import { TabBarInsetContext } from './TabBarInset';
import { IconButton } from './ui';

interface ScreenProps extends ScrollViewProps {
  title?: string;
  /** Small Swedish kicker shown above the title. */
  kicker?: string;
  subtitle?: string;
  right?: ReactNode;
  /** Shows a back (or close) button for stack / modal screens. */
  back?: 'back' | 'close';
  children: ReactNode;
  scroll?: boolean;
}

/** Standard screen: warm background, large serif title, comfortable margins. */
export function Screen({ title, kicker, subtitle, right, back, children, scroll = true, contentContainerStyle, ...rest }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const tabInset = use(TabBarInsetContext);
  const header =
    title || back || right ? (
      <View style={styles.header}>
        {back ? (
          <View style={styles.headerTop}>
            <IconButton name={back === 'close' ? 'close' : 'back'} label={back === 'close' ? 'Close' : 'Back'} onPress={() => router.back()} filled />
            <View style={{ flex: 1 }} />
            {right}
          </View>
        ) : null}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            {kicker ? (
              <AppText variant="label" tone="accent" style={{ marginBottom: 4 }}>
                {kicker}
              </AppText>
            ) : null}
            {title ? (
              <AppText variant="hero" accessibilityRole="header">
                {title}
              </AppText>
            ) : null}
            {subtitle ? (
              <AppText tone="soft" style={{ marginTop: 4 }}>
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {!back && right ? <View style={styles.rightSlot}>{right}</View> : null}
        </View>
      </View>
    ) : null;

  const padding = {
    paddingTop: insets.top + (back ? space.sm : space.xl),
    paddingBottom: insets.bottom + (tabInset || space.xxxl),
  };

  if (!scroll) {
    return (
      <View style={[styles.flex, { backgroundColor: t.background }, padding]}>
        <View style={styles.inner}>{header}</View>
        {children}
      </View>
    );
  }
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: t.background }]}
      contentContainerStyle={[styles.inner, padding, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      contentInsetAdjustmentBehavior="never"
      {...rest}>
      {header}
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { paddingHorizontal: space.xl, gap: space.xxl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { gap: space.md },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  rightSlot: { flexDirection: 'row', gap: space.sm, paddingBottom: 4 },
});
