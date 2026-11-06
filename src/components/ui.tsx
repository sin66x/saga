/**
 * Small reusable UI building blocks: buttons, cards, chips, progress bars.
 */
import * as Haptics from 'expo-haptics';
import { type ReactNode, useMemo } from 'react';
import { ActivityIndicator, Pressable, type PressableProps, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSettings } from '@/features/settings/SettingsProvider';
import { useTheme } from '@/theme/ThemeContext';
import { cardShadow, fonts, radius, space } from '@/theme/tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/* ------------------------------------------------------------------ */

/** Haptic helpers. The returned object is stable (it only changes when the setting does), so it is safe in dependency lists. */
export function useHaptics() {
  const { haptics } = useSettings().settings;
  return useMemo(
    () => ({
      light: () => haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
      soft: () => haptics && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}),
      selection: () => haptics && Haptics.selectionAsync().catch(() => {}),
      success: () => haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
      error: () => haptics && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {}),
    }),
    [haptics],
  );
}

/** Pressable with a gentle press-in scale and dim. */
export function Touchable({ style, children, pressedScale = 0.98, ...rest }: PressableProps & { pressedScale?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, pressed && { transform: [{ scale: pressedScale }], opacity: 0.88 }]}>
      {children}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */

type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'soft' | 'danger';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  disabled,
  loading,
  style,
  compact,
  accessibilityLabel,
  decorative,
}: {
  title: string;
  onPress?: () => void;
  kind?: ButtonKind;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  accessibilityLabel?: string;
  /** Render as a non-interactive pill (inside a pressable card, to avoid nested buttons). */
  decorative?: boolean;
}) {
  const t = useTheme();
  const colors: Record<ButtonKind, { bg: string; fg: string; border?: string }> = {
    primary: { bg: t.accent, fg: t.accentInk },
    secondary: { bg: t.surface, fg: t.ink, border: t.line },
    ghost: { bg: 'transparent', fg: t.accent },
    soft: { bg: t.accentSoft, fg: t.accent },
    danger: { bg: t.errorSoft, fg: t.error },
  };
  const c = colors[kind];
  if (decorative) {
    return (
      <View style={[styles.button, compact && styles.buttonCompact, { backgroundColor: c.bg, borderColor: c.border ?? 'transparent' }, style]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {icon && <Icon name={icon} size={compact ? 15 : 17} color={c.fg} weight="semibold" />}
        <AppText style={{ color: c.fg, fontFamily: fonts.uiBold, fontSize: compact ? 14.5 : 16.5 }}>{title}</AppText>
      </View>
    );
  }
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: c.bg, borderColor: c.border ?? 'transparent', opacity: disabled ? 0.45 : 1 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={compact ? 15 : 17} color={c.fg} weight="semibold" />}
          <AppText style={{ color: c.fg, fontFamily: fonts.uiBold, fontSize: compact ? 14.5 : 16.5 }}>{title}</AppText>
        </>
      )}
    </Touchable>
  );
}

export function IconButton({
  name,
  onPress,
  label,
  color,
  size = 20,
  filled,
  style,
}: {
  name: IconName;
  onPress?: () => void;
  label: string;
  color?: string;
  size?: number;
  filled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  return (
    <Touchable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      pressedScale={0.92}
      style={[styles.iconButton, filled && { backgroundColor: t.surface, ...cardShadow(t, 0.6) }, style]}>
      <Icon name={name} size={size} color={color ?? t.ink} />
    </Touchable>
  );
}

/* ------------------------------------------------------------------ */

export function Card({ children, style, onPress, tint, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; tint?: string; accessibilityLabel?: string }) {
  const t = useTheme();
  const base = [styles.card, { backgroundColor: tint ?? t.surface, borderColor: t.line }, cardShadow(t), style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Touchable onPress={onPress} style={base} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      {children}
    </Touchable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
  color,
  icon,
  small,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  icon?: IconName;
  small?: boolean;
}) {
  const t = useTheme();
  const fg = selected ? t.accentInk : (color ?? t.inkSoft);
  const bg = selected ? (color ?? t.accent) : t.surfaceAlt;
  const content = (
    <>
      {icon && <Icon name={icon} size={small ? 11 : 13} color={fg} />}
      <AppText style={{ color: fg, fontFamily: fonts.uiBold, fontSize: small ? 11.5 : 13.5 }}>{label}</AppText>
    </>
  );
  if (!onPress) return <View style={[styles.chip, small && styles.chipSmall, { backgroundColor: bg }]}>{content}</View>;
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: !!selected }} style={[styles.chip, small && styles.chipSmall, { backgroundColor: bg }]}>
      {content}
    </Touchable>
  );
}

/* ------------------------------------------------------------------ */

export function ProgressBar({ value, color, height = 6, track, style }: { value: number; color?: string; height?: number; track?: string; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      style={[{ height, borderRadius: height, backgroundColor: track ?? t.surfaceAlt, overflow: 'hidden' }, style]}>
      <View style={{ width: `${v * 100}%`, height: '100%', borderRadius: height, backgroundColor: color ?? t.accent }} />
    </View>
  );
}

export function ProgressRing({ value, size = 56, stroke = 6, color, children }: { value: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.surfaceAlt} strokeWidth={stroke} fill="none" />
        {v > 0 ? <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? t.accent}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c * v} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        /> : null}
      </Svg>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */

export function SectionHeader({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <AppText variant="heading" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="soft">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action && onAction ? (
        <Touchable onPress={onAction} hitSlop={10} accessibilityRole="button">
          <AppText variant="bodyStrong" tone="accent" style={{ fontSize: 15 }}>
            {action}
          </AppText>
        </Touchable>
      ) : null}
    </View>
  );
}

export function EmptyState({ icon, title, message, action, onAction }: { icon: IconName; title: string; message: string; action?: string; onAction?: () => void }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: t.accentSoft }]}>
        <Icon name={icon} size={30} color={t.accent} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      <AppText tone="soft" align="center" style={{ maxWidth: 300 }}>
        {message}
      </AppText>
      {action && onAction ? <Button title={action} onPress={onAction} style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

export function StatTile({ value, label, icon, color }: { value: string | number; label: string; icon?: IconName; color?: string }) {
  const t = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: t.surface, borderColor: t.line }]} accessible accessibilityLabel={`${label}: ${value}`}>
      {icon && <Icon name={icon} size={16} color={color ?? t.accent} />}
      <AppText variant="number" style={{ fontSize: 26, lineHeight: 30 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="soft" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.line, marginVertical: space.md }} />;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderWidth: 1,
  },
  buttonCompact: { minHeight: 40, paddingHorizontal: space.lg, borderRadius: radius.md },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.xl, padding: space.lg, borderWidth: StyleSheet.hairlineWidth },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill },
  chipSmall: { paddingHorizontal: 8, paddingVertical: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: space.md, gap: space.md },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  emptyIcon: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', marginBottom: space.xs },
  statTile: { flex: 1, minWidth: 140, borderRadius: radius.lg, padding: space.lg, gap: 2, borderWidth: StyleSheet.hairlineWidth },
});
