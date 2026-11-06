import { router } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Chip, IconButton, ProgressBar, Touchable } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { getAllProgress } from '@/db/repos/progress';
import { useDbQuery } from '@/db/useDbQuery';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function BooksScreen() {
  const t = useTheme();
  const { stories, importErrors } = useContent();
  const { width } = useWindowDimensions();
  const { data: progress } = useDbQuery(getAllProgress, ['progress']);
  const columns = width > 600 ? 3 : 2;
  const coverW = Math.floor((Math.min(width, 720) - space.xl * 2 - space.lg * (columns - 1)) / columns);
  const sorted = [...stories].sort((a, b) => a.manifest.level.difficulty - b.manifest.level.difficulty);

  return (
    <Screen
      kicker="Biblioteket"
      title="My Books"
      subtitle="Illustrated stories, from very easy to intermediate."
      right={<IconButton name="import" label="Import a story" onPress={() => router.push('/import')} filled />}>
      <View style={styles.grid}>
        {sorted.map((s, i) => {
          const p = progress?.[s.manifest.id];
          const ratio = p ? (p.completedAt ? 1 : (p.furthestPage + 1) / s.pages.length) : 0;
          return (
            <Animated.View key={s.manifest.id} entering={FadeInDown.delay(i * 70).duration(380)} style={{ width: coverW }}>
              <Touchable
                onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.manifest.id } })}
                style={{ gap: space.sm }}
                accessibilityLabel={`${s.manifest.title.sv}. ${s.manifest.title.en}. Level ${s.manifest.level.cefr}.`}>
                <BookCover story={s} width={coverW} />
                <View style={{ gap: 3 }}>
                  <AppText style={{ fontFamily: fonts.display, fontSize: 18, lineHeight: 22, color: t.ink }} numberOfLines={2}>
                    {s.manifest.title.sv}
                  </AppText>
                  <AppText variant="caption" tone="soft" numberOfLines={1}>
                    {s.manifest.title.en}
                  </AppText>
                </View>
                <View style={styles.meta}>
                  <Chip small label={s.manifest.level.cefr} color={s.manifest.theme?.accent} />
                  {s.source === 'imported' ? <Chip small label="imported" /> : null}
                </View>
                <View style={styles.metaRow}>
                  <Icon name="clock" size={12} color={t.inkFaint} />
                  <AppText variant="caption" tone="faint">
                    {s.manifest.estimatedReadingMinutes} min · {s.manifest.chapters.length} chapters
                  </AppText>
                </View>
                <View style={{ gap: 3 }}>
                  <ProgressBar value={ratio} height={4} color={s.manifest.theme?.accent} />
                  <AppText variant="caption" tone="faint" style={{ fontSize: 12 }}>
                    {p?.completedAt ? 'Finished ✓' : p ? `${Math.round(ratio * 100)}% read` : 'Not started'}
                  </AppText>
                </View>
              </Touchable>
            </Animated.View>
          );
        })}
      </View>

      <Touchable onPress={() => router.push('/import')} style={[styles.importCard, { borderColor: t.line }]} accessibilityRole="button" accessibilityLabel="Import a story package">
        <View style={[styles.importIcon, { backgroundColor: t.accentSoft }]}>
          <Icon name="plus" size={22} color={t.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodyStrong">Add a new story</AppText>
          <AppText variant="caption" tone="soft">
            Import a .zip or .json story package from the Files app.
          </AppText>
        </View>
      </Touchable>

      {importErrors.length ? (
        <View style={[styles.errorBox, { backgroundColor: t.errorSoft }]}>
          <AppText variant="bodyStrong" tone="error">
            Some imported stories could not be opened
          </AppText>
          {importErrors.map((e) => (
            <AppText key={e.storyId} variant="caption">
              {e.storyId}: {e.message}
            </AppText>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, rowGap: space.xxl },
  meta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  importCard: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.xl, borderWidth: 1.5, borderStyle: 'dashed' },
  importIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  errorBox: { padding: space.lg, borderRadius: radius.lg, gap: 4 },
});
