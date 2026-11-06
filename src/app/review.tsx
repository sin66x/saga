/**
 * Daily review: spaced-repetition flashcards. Front = Swedish word + story sentence,
 * back = meaning and forms. The learner grades their own recall.
 */
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FlipInEasyX } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Button, EmptyState, IconButton, ProgressBar, Touchable, useHaptics } from '@/components/ui';
import { listDue, reviewWord, type VocabItem } from '@/db/repos/vocabulary';
import { formTables, headword, posLabel } from '@/features/dictionary/presentation';
import { FormsGrid } from '@/features/vocabulary/FormsGrid';
import { type Grade, nextInterval } from '@/features/vocabulary/srs';
import { speakSwedish } from '@/lib/speech';
import { describeInterval } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { cardShadow, fonts, radius, space } from '@/theme/tokens';

export default function ReviewScreen() {
  const t = useTheme();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();
  const [queue, setQueue] = useState<VocabItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [stats, setStats] = useState({ again: 0, good: 0 });

  useEffect(() => {
    listDue(db, 40).then(setQueue);
  }, [db]);

  if (!queue) return <View style={{ flex: 1, backgroundColor: t.background }} />;

  const item = queue[index];
  if (!item) {
    const reviewed = stats.again + stats.good;
    return (
      <View style={[styles.flex, { backgroundColor: t.background, paddingTop: insets.top + space.xl }]}>
        <View style={{ paddingHorizontal: space.lg }}>
          <IconButton name="close" label="Close" onPress={() => router.back()} filled />
        </View>
        {reviewed ? (
          <EmptyState icon="checkCircle" title="Bra jobbat!" message={`You reviewed ${reviewed} word${reviewed === 1 ? '' : 's'}. ${stats.again ? `${stats.again} will come back soon for another try.` : 'Everything remembered!'}`} action="Done" onAction={() => router.back()} />
        ) : (
          <EmptyState icon="sparkles" title="All caught up" message="No words are due right now. Read a few pages or try a grammar topic." action="Back" onAction={() => router.back()} />
        )}
      </View>
    );
  }

  const grade = async (g: Grade) => {
    if (g === 'again') haptics.error();
    else haptics.success();
    const next = await reviewWord(db, item, g, 'flashcard');
    setStats((s) => (g === 'again' ? { ...s, again: s.again + 1 } : { ...s, good: s.good + 1 }));
    // Forgotten words come back at the end of today's session (with their updated state).
    if (g === 'again') setQueue((q) => (q ? [...q, { ...item, ...next }] : q));
    setFlipped(false);
    setIndex((i) => i + 1);
  };

  const title = item.pos === 'unknown' ? item.word : headword({ lemma: item.lemma, pos: item.pos, gender: item.gender ?? undefined });
  const tables = formTables(item.pos, item.forms, item.gender, item.lemma);
  const buttons: { g: Grade; label: string; color: string; soft: string }[] = [
    { g: 'again', label: 'Again', color: t.error, soft: t.errorSoft },
    { g: 'hard', label: 'Hard', color: t.gold, soft: t.goldSoft },
    { g: 'good', label: 'Good', color: t.green, soft: t.greenSoft },
    { g: 'easy', label: 'Easy', color: t.blue, soft: t.blueSoft },
  ];

  return (
    <View style={[styles.flex, { backgroundColor: t.background }]}>
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton name="close" label="End review" onPress={() => router.back()} filled />
        <View style={{ flex: 1, gap: 4 }}>
          <ProgressBar value={index / queue.length} height={8} color={t.accent} />
          <AppText variant="caption" tone="soft">
            Dagens repetition · {index + 1} of {queue.length}
          </AppText>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 160 }]}>
        <Animated.View key={`${item.id}-${index}`} entering={FlipInEasyX.duration(350)} style={[styles.card, { backgroundColor: t.paper, borderColor: t.line }, cardShadow(t, 1.4)]}>
          <View style={styles.cardTop}>
            <AppText variant="label" tone="faint">
              {item.pos === 'unknown' ? 'Word' : posLabel(item.pos)}
            </AppText>
            <Touchable onPress={() => speakSwedish(item.lemma)} hitSlop={10} accessibilityLabel="Listen">
              <Icon name="speaker" size={20} color={t.blue} />
            </Touchable>
          </View>
          <AppText variant="hero" align="center" style={{ fontSize: 40, lineHeight: 48 }}>
            {title}
          </AppText>
          {item.sentence ? (
            <AppText variant="readingItalic" tone="soft" align="center" style={{ fontSize: 17, lineHeight: 25 }}>
              “{item.sentence}”
            </AppText>
          ) : null}

          {flipped ? (
            <Animated.View entering={FadeIn.duration(250)} style={{ gap: space.lg, width: '100%' }}>
              <View style={[styles.divider, { backgroundColor: t.line }]} />
              <AppText align="center" style={{ fontFamily: fonts.readMedium, fontSize: 24, lineHeight: 32, color: t.ink }}>
                {item.translation || '—'}
              </AppText>
              {tables.length ? <FormsGrid tables={tables} compact /> : null}
              {item.notes ? (
                <AppText variant="caption" tone="soft" align="center">
                  📝 {item.notes}
                </AppText>
              ) : null}
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.md, backgroundColor: t.background, borderColor: t.line }]}>
        {!flipped ? (
          <Button title="Show answer" icon="eye" onPress={() => setFlipped(true)} />
        ) : (
          <View style={{ gap: space.sm }}>
            <AppText variant="caption" tone="soft" align="center">
              How well did you remember?
            </AppText>
            <View style={styles.grades}>
              {buttons.map((b) => (
                <Touchable key={b.g} onPress={() => grade(b.g)} style={[styles.grade, { backgroundColor: b.soft }]} accessibilityLabel={`${b.label}, next review in ${describeInterval(nextInterval(item, b.g))}`}>
                  <AppText style={{ fontFamily: fonts.uiHeavy, fontSize: 15, color: b.color }}>{b.label}</AppText>
                  <AppText variant="caption" tone="soft" style={{ fontSize: 11.5 }}>
                    {describeInterval(nextInterval(item, b.g))}
                  </AppText>
                </Touchable>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.sm },
  body: { padding: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  card: { borderRadius: radius.xl, padding: space.xxl, alignItems: 'center', gap: space.lg, minHeight: 320, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
  cardTop: { position: 'absolute', top: space.lg, left: space.xl, right: space.xl, flexDirection: 'row', justifyContent: 'space-between' },
  divider: { height: 1, width: '60%', alignSelf: 'center' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  grades: { flexDirection: 'row', gap: space.sm },
  grade: { flex: 1, alignItems: 'center', paddingVertical: space.md, borderRadius: radius.lg, gap: 2 },
});
