import { StyleSheet, View } from 'react-native';
import type { Story } from '@/content/types';
import { useTheme } from '@/theme/ThemeContext';
import { cardShadow, radius } from '@/theme/tokens';
import { Illustration } from './Illustration';

/**
 * A storybook cover: the illustration with a soft spine shadow on the left and
 * rounded "hardcover" corners.
 */
export function BookCover({ story, width }: { story: Story; width: number }) {
  const t = useTheme();
  const { cover, theme } = story.manifest;
  const height = width / (cover.aspect ?? 0.75);
  return (
    <View style={[styles.wrap, { width, height }, cardShadow(t, 1.2)]}>
      <View style={[styles.inner, { backgroundColor: theme?.coverTint ?? t.surfaceAlt }]}>
        <Illustration source={story.resolveAsset(cover.src)} aspect={width / height} alt={cover.alt} style={StyleSheet.absoluteFill} />
        <View style={styles.spine} />
        <View style={styles.spineLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md },
  inner: { flex: 1, borderRadius: radius.md, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, overflow: 'hidden' },
  spine: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, backgroundColor: 'rgba(40,25,10,0.16)' },
  spineLine: { position: 'absolute', left: 12, top: 0, bottom: 0, width: 1.5, backgroundColor: 'rgba(255,255,255,0.35)' },
});
