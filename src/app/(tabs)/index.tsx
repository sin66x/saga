import { router } from 'expo-router';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, IconButton, ProgressBar, ProgressRing, SectionHeader, Touchable } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { getAllProgress, getContinueReading } from '@/db/repos/progress';
import { getTopicStats } from '@/db/repos/results';
import { getDashboardStats } from '@/db/repos/stats';
import { getVocabCounts } from '@/db/repos/vocabulary';
import { useDbQuery } from '@/db/useDbQuery';
import { estimateLevel } from '@/features/progress/level';
import { swedishDate, swedishGreeting } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function HomeScreen() {
  const t = useTheme();
  const { stories, getStory } = useContent();
  const { width } = useWindowDimensions();
  const { data } = useDbQuery(
    async (db) => {
      const [cont, progress, vocab, stats, grammar] = await Promise.all([getContinueReading(db), getAllProgress(db), getVocabCounts(db), getDashboardStats(db), getTopicStats(db, 'grammar')]);
      return { cont, progress, vocab, stats, grammar };
    },
    ['progress', 'vocabulary', 'results', 'stories'],
  );
  const now = new Date();
  const greeting = swedishGreeting(now);
  const contStory = data?.cont ? getStory(data.cont.storyId) : stories[0];
  const contProgress = data?.cont && contStory && data.cont.storyId === contStory.manifest.id ? data.cont : null;
  const vocab = data?.vocab;
  const stats = data?.stats;
  const hardest = Math.max(0, ...(stats?.storiesCompleted ?? []).map((id) => getStory(id)?.manifest.level.difficulty ?? 0));
  const goodTopics = Object.values(data?.grammar ?? {}).filter((s) => s.attempts >= 4 && s.correct / s.attempts >= 0.7).length;
  const level = estimateLevel({ hardestCompletedDifficulty: hardest, goodGrammarTopics: goodTopics, wordsMastered: stats?.wordsMastered ?? 0 });
  const masteredRatio = vocab && vocab.total ? vocab.byStatus.mastered / vocab.total : 0;

  return (
    <Screen
      kicker={swedishDate(now)}
      title={`${greeting.sv}!`}
      subtitle={contProgress ? 'Dags för en ny sida? · Time for a new page?' : 'Välkommen! Let’s start reading Swedish.'}
      right={<IconButton name="settings" label="Settings" onPress={() => router.push('/settings')} filled />}>
      {/* Continue reading */}
      {contStory ? (
        <Animated.View entering={FadeInDown.duration(400)}>
          <Card
            tint={contStory.manifest.theme?.coverTint ?? t.surfaceAlt}
            style={styles.continueCard}
            onPress={() => router.push({ pathname: '/read/[id]', params: { id: contStory.manifest.id } })}
            accessibilityLabel={`Continue reading ${contStory.manifest.title.sv}`}>
            <BookCover story={contStory} width={Math.min(118, width * 0.3)} />
            <View style={{ flex: 1, gap: space.sm }}>
              <AppText variant="label" style={{ color: contStory.manifest.theme?.accent ?? t.accent }}>
                {contProgress ? 'Fortsätt läsa' : 'Börja läsa'}
              </AppText>
              <AppText variant="heading" style={{ color: '#2E2A25' }} numberOfLines={2}>
                {contStory.manifest.title.sv}
              </AppText>
              <AppText variant="caption" style={{ color: '#655E55' }} numberOfLines={1}>
                {contProgress
                  ? contStory.manifest.chapters[contStory.pages[Math.min(contProgress.currentPage, contStory.pages.length - 1)].chapterIndex].title.sv
                  : contStory.manifest.title.en}
              </AppText>
              {contProgress ? (
                <View style={{ gap: 4 }}>
                  <ProgressBar value={(contProgress.furthestPage + 1) / contStory.pages.length} color={contStory.manifest.theme?.accent} track="rgba(0,0,0,0.08)" />
                  <AppText variant="caption" style={{ color: '#655E55' }}>
                    Page {contProgress.currentPage + 1} of {contStory.pages.length}
                  </AppText>
                </View>
              ) : null}
              <Button
                compact
                title={contProgress ? 'Continue' : 'Start reading'}
                icon="play"
                style={{ alignSelf: 'flex-start', backgroundColor: contStory.manifest.theme?.accent ?? t.accent }}
                decorative
              />
            </View>
          </Card>
        </Animated.View>
      ) : null}

      {/* My books */}
      <View>
        <SectionHeader title="My Books" subtitle="Mina böcker" action="All books" onAction={() => router.push('/books')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: space.lg, paddingRight: space.xl, paddingVertical: 6 }} style={{ marginHorizontal: -space.xl, paddingLeft: space.xl }}>
          {stories.map((s) => {
            const p = data?.progress[s.manifest.id];
            const ratio = p ? (p.completedAt ? 1 : (p.furthestPage + 1) / s.pages.length) : 0;
            return (
              <Touchable key={s.manifest.id} onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.manifest.id } })} style={{ width: 124, gap: 6 }} accessibilityLabel={`${s.manifest.title.sv}, ${s.manifest.level.cefr}`}>
                <BookCover story={s} width={124} />
                <AppText style={{ fontFamily: fonts.display, fontSize: 15, lineHeight: 19, color: t.ink }} numberOfLines={2}>
                  {s.manifest.title.sv}
                </AppText>
                <ProgressBar value={ratio} height={3} color={s.manifest.theme?.accent} />
              </Touchable>
            );
          })}
        </ScrollView>
      </View>

      {/* Vocabulary + practice */}
      <View style={styles.twoCol}>
        <Card style={styles.half} onPress={() => router.push('/vocabulary')} accessibilityLabel="My Vocabulary">
          <View style={styles.cardHead}>
            <Icon name="vocabulary" size={18} color={t.blue} />
            <AppText variant="label" tone="blue">
              My Words
            </AppText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <ProgressRing value={masteredRatio} size={58} stroke={6} color={t.blue}>
              <AppText style={{ fontFamily: fonts.uiHeavy, fontSize: 13, color: t.ink }}>{Math.round(masteredRatio * 100)}%</AppText>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <AppText variant="number" style={{ fontSize: 26 }}>
                {vocab?.total ?? 0}
              </AppText>
              <AppText variant="caption" tone="soft">
                words saved
              </AppText>
            </View>
          </View>
          {vocab?.recent.length ? (
            <View style={styles.chips}>
              {vocab.recent.slice(0, 3).map((w) => (
                <Chip key={w.id} small label={w.lemma} />
              ))}
            </View>
          ) : (
            <AppText variant="caption" tone="soft">
              Long-press a word while reading to save it.
            </AppText>
          )}
        </Card>

        <Card style={styles.half}>
          <View style={styles.cardHead}>
            <Icon name="practice" size={18} color={t.green} />
            <AppText variant="label" tone="green">
              Practice
            </AppText>
          </View>
          <AppText variant="number" style={{ fontSize: 26 }}>
            {vocab?.due ?? 0}
          </AppText>
          <AppText variant="caption" tone="soft">
            {vocab?.due ? 'words need practice today' : 'no words due – try grammar!'}
          </AppText>
          <Button compact kind="soft" title={vocab?.due ? 'Review' : 'Grammar'} onPress={() => router.push(vocab?.due ? '/review' : '/practice')} style={{ marginTop: 'auto' }} />
        </Card>
      </View>

      {/* Knowledge */}
      <Card tint={t.goldSoft} onPress={() => router.push('/knowledge')} style={styles.knowledge} accessibilityLabel="Swedish knowledge quiz">
        <View style={[styles.knowledgeIcon, { backgroundColor: t.gold }]}>
          <Icon name="globe" size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="label" tone="gold">
            Svensk kunskap
          </AppText>
          <AppText variant="subheading">Swedish history & culture</AppText>
          <AppText variant="caption" tone="soft">
            Test what you remember from the stories.
          </AppText>
        </View>
        <Icon name="forward" size={16} color={t.inkFaint} />
      </Card>

      {/* Progress */}
      <View>
        <SectionHeader title="Learning progress" subtitle="Dina framsteg" action="Details" onAction={() => router.push('/progress')} />
        <Card style={{ gap: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
            <View style={[styles.levelBadge, { backgroundColor: t.accentSoft }]}>
              <AppText style={{ fontFamily: fonts.display, fontSize: 18, color: t.accent }}>{level.cefr}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">Current level: {level.label}</AppText>
              {level.next ? (
                <AppText variant="caption" tone="soft">
                  {level.next}
                </AppText>
              ) : null}
            </View>
          </View>
          <View style={styles.statsRow}>
            <MiniStat value={stats?.storiesCompleted.length ?? 0} label="stories finished" />
            <MiniStat value={stats?.wordsTotal ?? 0} label="words collected" />
            <MiniStat value={stats?.wordsMastered ?? 0} label="words mastered" />
            <MiniStat value={(stats?.grammarAnswered ?? 0) + (stats?.vocabExercises ?? 0)} label="exercises done" />
          </View>
        </Card>
      </View>
    </Screen>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }} accessible accessibilityLabel={`${value} ${label}`}>
      <AppText variant="number" style={{ fontSize: 24, lineHeight: 28 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="soft" align="center" style={{ fontSize: 12 }}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  continueCard: { flexDirection: 'row', gap: space.lg, padding: space.lg, borderRadius: radius.xl, borderWidth: 0 },
  twoCol: { flexDirection: 'row', gap: space.md },
  half: { flex: 1, gap: space.sm, minHeight: 170 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  knowledge: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 0 },
  knowledgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  levelBadge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', gap: space.sm },
});
