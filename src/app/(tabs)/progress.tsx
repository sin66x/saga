/**
 * Learning dashboard. Calm, non-competitive: what you have done and what is next.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, ProgressBar, SectionHeader, StatTile, Touchable } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { getAllProgress } from '@/db/repos/progress';
import { getQuizStats, getTopicStats } from '@/db/repos/results';
import { getDashboardStats } from '@/db/repos/stats';
import { useDbQuery } from '@/db/useDbQuery';
import { GRAMMAR_TOPICS } from '@/features/grammar';
import { estimateLevel } from '@/features/progress/level';
import { STATUS_LABELS, STATUSES } from '@/features/vocabulary/srs';
import { formatDuration } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, learningStateColors, radius, space } from '@/theme/tokens';

export default function ProgressScreen() {
  const t = useTheme();
  const { stories, getStory } = useContent();
  const { data } = useDbQuery(
    async (db) => ({ stats: await getDashboardStats(db), progress: await getAllProgress(db), quiz: await getQuizStats(db), grammar: await getTopicStats(db, 'grammar') }),
    ['progress', 'vocabulary', 'results'],
  );
  const s = data?.stats;
  const hardest = Math.max(0, ...(s?.storiesCompleted ?? []).map((id) => getStory(id)?.manifest.level.difficulty ?? 0));
  const goodTopics = Object.values(data?.grammar ?? {}).filter((g) => g.attempts >= 4 && g.correct / g.attempts >= 0.7).length;
  const level = estimateLevel({ hardestCompletedDifficulty: hardest, goodGrammarTopics: goodTopics, wordsMastered: s?.wordsMastered ?? 0 });
  const maxMinutes = Math.max(1, ...(s?.week.map((d) => d.minutes) ?? [0]));
  const weekTotal = s?.week.reduce((a, d) => a + d.minutes, 0) ?? 0;
  const stateColors = learningStateColors[t.scheme];
  const accuracy = s && s.grammarAnswered ? Math.round((s.grammarCorrect / s.grammarAnswered) * 100) : null;

  return (
    <Screen kicker="Framsteg" title="Progress" subtitle="Small steps every day. Det går framåt!">
      {/* Level */}
      <Card style={styles.levelCard} tint={t.accentSoft}>
        <View style={[styles.levelBadge, { backgroundColor: t.accent }]}>
          <AppText style={{ fontFamily: fonts.display, fontSize: 24, color: t.accentInk }}>{level.cefr}</AppText>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="label" tone="accent">
            Current level
          </AppText>
          <AppText variant="heading">{level.label}</AppText>
          {level.next ? (
            <AppText variant="caption" tone="soft">
              {level.next}
            </AppText>
          ) : null}
        </View>
      </Card>

      {/* Headline numbers */}
      <View style={styles.grid}>
        <StatTile icon="clock" value={formatDuration(s?.readingSeconds ?? 0)} label="total reading time" />
        <StatTile icon="flame" value={s?.streakDays ?? 0} label={s?.streakDays === 1 ? 'day in a row' : 'days in a row'} color={t.gold} />
        <StatTile icon="book" value={`${s?.storiesCompleted.length ?? 0}/${stories.length}`} label="stories finished" color={t.green} />
        <StatTile icon="doc" value={s?.pagesRead ?? 0} label="pages read" color={t.blue} />
      </View>

      {/* Weekly reading */}
      <View>
        <SectionHeader title="Reading this week" subtitle={`${weekTotal} minutes in the last 7 days`} />
        <Card>
          {weekTotal === 0 ? (
            <AppText variant="caption" tone="soft" align="center" style={{ marginBottom: space.sm }}>
              No reading time this week yet – open a book and the bars will grow.
            </AppText>
          ) : null}
          <View
            style={styles.week}
            accessible
            accessibilityLabel={`Minutes read per day: ${(s?.week ?? []).map((d) => `${d.label} ${d.minutes}`).join(', ')}`}>
            {(s?.week ?? []).map((d, i) => {
              const isToday = i === 6;
              const showValue = d.minutes > 0 && (d.minutes === maxMinutes || isToday);
              return (
                <View key={d.day} style={styles.dayCol}>
                  <AppText variant="caption" tone="soft" style={{ fontFamily: fonts.uiBold, fontSize: 11.5, opacity: showValue ? 1 : 0 }}>
                    {d.minutes}
                  </AppText>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height: `${Math.max(d.minutes ? 6 : 0, (d.minutes / maxMinutes) * 100)}%`, backgroundColor: t.accent }]} />
                  </View>
                  <AppText variant="caption" style={{ fontFamily: isToday ? fonts.uiHeavy : fonts.ui, color: isToday ? t.ink : t.inkFaint, fontSize: 12 }}>
                    {d.label}
                  </AppText>
                </View>
              );
            })}
          </View>
        </Card>
      </View>

      {/* Vocabulary */}
      <View>
        <SectionHeader title="Vocabulary" subtitle={`${s?.wordsTotal ?? 0} words · ${s?.wordsDue ?? 0} waiting for review`} action="My Words" onAction={() => router.push('/vocabulary')} />
        <Card style={{ gap: space.lg }}>
          {s?.wordsTotal ? (
            <>
              <View style={styles.stack} accessible accessibilityLabel={STATUSES.map((st) => `${STATUS_LABELS[st].en} ${s.wordsByStatus[st] ?? 0}`).join(', ')}>
                {STATUSES.map((st) => {
                  const n = s.wordsByStatus[st] ?? 0;
                  return n ? <View key={st} style={{ flex: n, backgroundColor: stateColors[st], borderRadius: 4 }} /> : null;
                })}
              </View>
              <View style={styles.legend}>
                {STATUSES.map((st) => (
                  <View key={st} style={styles.legendItem}>
                    <View style={[styles.swatch, { backgroundColor: stateColors[st] }]} />
                    <AppText variant="caption" tone="soft">
                      {STATUS_LABELS[st].en}{' '}
                      <AppText variant="caption" style={{ fontFamily: fonts.uiHeavy, color: t.ink }}>
                        {s.wordsByStatus[st] ?? 0}
                      </AppText>
                    </AppText>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <AppText tone="soft">Save words while reading to see your vocabulary grow.</AppText>
          )}
          <View style={styles.row}>
            <AppText tone="soft" style={{ flex: 1 }}>
              Reviews done
            </AppText>
            <AppText variant="bodyStrong">{s?.reviewsDone ?? 0}</AppText>
          </View>
          <View style={styles.row}>
            <AppText tone="soft" style={{ flex: 1 }}>
              Vocabulary exercises
            </AppText>
            <AppText variant="bodyStrong">{s?.vocabExercises ?? 0}</AppText>
          </View>
        </Card>
      </View>

      {/* Grammar */}
      <View>
        <SectionHeader title="Grammar" subtitle={`${s?.grammarTopicsPracticed ?? 0} of ${GRAMMAR_TOPICS.length} topics practised`} action="Practice" onAction={() => router.push('/practice')} />
        <Card style={{ gap: space.md }}>
          <View style={styles.row}>
            <AppText tone="soft" style={{ flex: 1 }}>
              Exercises answered
            </AppText>
            <AppText variant="bodyStrong">{s?.grammarAnswered ?? 0}</AppText>
          </View>
          <View style={styles.row}>
            <AppText tone="soft" style={{ flex: 1 }}>
              Correct
            </AppText>
            <AppText variant="bodyStrong">{accuracy === null ? '—' : `${accuracy}%`}</AppText>
          </View>
          <ProgressBar value={(s?.grammarTopicsPracticed ?? 0) / GRAMMAR_TOPICS.length} color={t.green} height={8} />
          {GRAMMAR_TOPICS.filter((g) => data?.grammar[g.id])
            .slice(0, 8)
            .map((g) => {
              const st = data!.grammar[g.id];
              return (
                <Touchable key={g.id} onPress={() => router.push({ pathname: '/grammar/[topic]', params: { topic: g.id } })} style={styles.row}>
                  <AppText variant="caption" style={{ flex: 1 }} numberOfLines={1}>
                    {g.title}
                  </AppText>
                  <AppText variant="caption" tone="soft">
                    {st.mastered}/{g.exercises.length}
                  </AppText>
                </Touchable>
              );
            })}
        </Card>
      </View>

      {/* Quizzes */}
      <View>
        <SectionHeader title="Quiz scores" subtitle="Best result per story" />
        <Card style={{ gap: space.lg }}>
          {stories.map((story) => {
            const q = data?.quiz[story.manifest.id];
            const ratio = q ? q.best / q.bestTotal : 0;
            return (
              <Touchable key={story.manifest.id} onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: story.manifest.id } })} style={{ gap: 6 }} accessibilityLabel={`${story.manifest.title.sv}: ${q ? `${q.best} of ${q.bestTotal}` : 'not taken'}`}>
                <View style={styles.row}>
                  <AppText variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                    {story.manifest.title.sv}
                  </AppText>
                  <AppText variant="caption" tone="soft">
                    {q ? `${q.best}/${q.bestTotal}` : 'not taken'}
                  </AppText>
                </View>
                <ProgressBar value={ratio} color={story.manifest.theme?.accent} height={6} />
              </Touchable>
            );
          })}
          {data?.quiz.knowledge ? (
            <View style={styles.row}>
              <Icon name="globe" size={15} color={t.gold} />
              <AppText variant="caption" tone="soft" style={{ flex: 1 }}>
                Svensk kunskap: best {data.quiz.knowledge.best}/{data.quiz.knowledge.bestTotal} ({data.quiz.knowledge.attempts} sessions)
              </AppText>
            </View>
          ) : null}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  levelCard: { flexDirection: 'row', alignItems: 'center', gap: space.lg, borderWidth: 0 },
  levelBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  week: { flexDirection: 'row', height: 150, gap: space.sm, alignItems: 'flex-end' },
  dayCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  stack: { flexDirection: 'row', height: 16, gap: 2, borderRadius: radius.sm, overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
