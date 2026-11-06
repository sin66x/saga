import { Image } from 'expo-image';
import { memo } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import type { AssetSource } from '@/content/types';
import { useTheme } from '@/theme/ThemeContext';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface Props {
  source: AssetSource | undefined;
  aspect?: number;
  alt?: string;
  style?: StyleProp<ViewStyle>;
  /** "cover" crops to fill; "contain" letterboxes (maps, diagrams). */
  fit?: 'cover' | 'contain';
}

/**
 * Renders a story illustration: SVG markup (built-in and imported SVG) or a bitmap (PNG/JPG/WebP).
 */
export const Illustration = memo(function Illustration({ source, aspect = 4 / 3, alt, style, fit = 'cover' }: Props) {
  const t = useTheme();
  const box = [styles.box, { aspectRatio: aspect, backgroundColor: t.surfaceAlt }, style];
  const a11y = { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel: alt };
  const preserve = fit === 'cover' ? 'xMidYMid slice' : 'xMidYMid meet';

  if (!source || source.kind === 'missing') {
    return (
      <View style={[box, styles.placeholder]} {...a11y}>
        <Icon name="book" size={28} color={t.inkFaint} />
        {alt ? (
          <AppText variant="caption" tone="faint" align="center" numberOfLines={3} style={{ paddingHorizontal: 16 }}>
            {alt}
          </AppText>
        ) : null}
      </View>
    );
  }
  if (source.kind === 'bitmap') {
    return (
      <View style={box} {...a11y}>
        <Image source={{ uri: source.uri }} style={StyleSheet.absoluteFill} contentFit={fit} transition={250} />
      </View>
    );
  }
  return (
    <View style={box} {...a11y}>
      <SvgXml xml={withAspect(source.xml, preserve)} width="100%" height="100%" />
    </View>
  );
});

/** Ensures the root <svg> scales to its box with the requested fit. */
function withAspect(xml: string, preserve: string): string {
  return xml.replace(/<svg\b([^>]*)>/, (_m, attrs: string) => {
    const cleaned = attrs.replace(/\s(width|height|preserveAspectRatio)="[^"]*"/g, '');
    return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="${preserve}">`;
  });
}

const styles = StyleSheet.create({
  box: { width: '100%', overflow: 'hidden' },
  placeholder: { alignItems: 'center', justifyContent: 'center', gap: 8 },
});
