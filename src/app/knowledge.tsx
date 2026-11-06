/**
 * Swedish Knowledge: history & culture questions from all completed stories.
 * Questions answered wrongly last time are asked first.
 */
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import type { QuizQuestion, Story } from '@/content/types';
import { getAllProgress } from '@/db/repos/progress';
import { getLastAnswers, getQuizStats, type QuizAnswer, saveQuizAttempt } from '@/db/repos/results';
import { useDbQuery } from '@/db/useDbQuery';
import { ExerciseSession, type SessionItem } from '@/features/exercises/ExerciseSession';
import { CATEGORY_LABELS, QuizFeedback } from '@/features/quiz/QuizFeedback';
import { nowIso, shuffle } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { space } from '@/theme/tokens';

const KNOWLEDGE = ['history', 'culture'] as const;
const SESSION_SIZE = 10;

export default function KnowledgeScreen() {
  const t = useTheme();
  const db = useSQLiteContext();
  const { stories } = useContent();
  const { data } = useDbQuery(async (db) => ({ progress: await getAllProgress(db), last: await getLastAnswers(db), stats: await getQuizStats(db) }), ['progress', 'results']);
  const [session, setSession] = useState<{ items: SessionItem[]; lookup: Map<string, { q: QuizQuestion; story: Story }> } | null>(null);
  const answers = useRef<QuizAnswer[]>([]);
  const startedAt = useRef(nowIso());

  const unlocked = stories.filter((s) => data?.progress[s.manifest.id]?.completedAt);
  const locked = stories.filter((s) => !data?.progress[s.manifest.id]?.completedAt);
  const pool = unlocked.flatMap((s) => s.quiz.filter((q) => (KNOWLEDGE as readonly string[]).includes(q.category)).map((q) => ({ q, story: s })));

  const start = () => {
    const last = data?.last ?? {};
    const missed = pool.filter(({ q, story }) => last[`${story.manifest.id}/${q.id}`] === false);
    const fresh = pool.filter(({ q, story }) => last[`${story.manifest.id}/${q.id}`] === undefined);
    const known = pool.filter(({ q, story }) => last[`${story.manifest.id}/${q.id}`] === true);
    const picked = [...shuffle(missed), ...shuffle(fresh), ...shuffle(known)].slice(0, SESSION_SIZE);
    const lookup = new Map<string, { q: QuizQuestion; story: Story }>();
    const items = shuffle(picked).map(({ q, story }) => {
      const key = `${story.manifest.id}/${q.id}`;
      lookup.set(key, { q, story });
      return { key, exercise: q, tag: `${CATEGORY_LABELS[q.category]} · ${story.manifest.title.sv}` };
    });
    answers.current = [];
    startedAt.current = nowIso();
    setSession({ items, lookup });
  };

  if (session) {
    return (
      <ExerciseSession
        title="Svensk kunskap"
        items={session.items}
        onAnswer={(item, correct) => {
          const entry = session.lookup.get(item.key);
          if (entry) answers.current.push({ storyId: entry.story.manifest.id, questionId: entry.q.id, correct });
        }}
        onFinish={() => saveQuizAttempt(db, 'knowledge', startedAt.current, answers.current)}
        renderFeedbackExtra={(item) => {
          const entry = session.lookup.get(item.key);
          return entry ? <QuizFeedback question={entry.q} story={entry.story} /> : null;
        }}
      />
    );
  }

  const best = data?.stats.knowledge;

  return (
    <Screen back="back" kicker="Svensk kunskap" title="History & Culture" subtitle="Mixed questions about Swedish history, traditions and society from the stories you have finished.">
      <Card tint={t.goldSoft} style={{ gap: space.md, borderWidth: 0 }}>
        <View style={styles.row}>
          <Icon name="globe" size={22} color={t.gold} />
          <AppText variant="subheading" style={{ flex: 1 }}>
            {pool.length} questions available
          </AppText>
        </View>
        {best ? (
          <AppText variant="caption" tone="soft">
            Last time: {best.last}/{best.lastTotal} · Best: {best.best}/{best.bestTotal} · {best.attempts} sessions
          </AppText>
        ) : null}
        <Button title={pool.length ? `Start (${Math.min(SESSION_SIZE, pool.length)} questions)` : 'Finish a story to unlock'} icon="play" disabled={!pool.length} onPress={start} />
        <AppText variant="caption" tone="soft">
          Questions you answered wrongly last time come first.
        </AppText>
      </Card>

      {unlocked.length ? (
        <View style={{ gap: space.sm }}>
          <AppText variant="label" tone="green">
            Unlocked
          </AppText>
          <View style={styles.chips}>
            {unlocked.map((s) => (
              <Chip key={s.manifest.id} icon="checkCircle" label={s.manifest.title.sv} color={t.green} />
            ))}
          </View>
        </View>
      ) : null}

      {locked.length ? (
        <View style={{ gap: space.md }}>
          <AppText variant="label" tone="faint">
            Finish these stories to add their questions
          </AppText>
          {locked.map((s) => (
            <Card key={s.manifest.id} style={styles.lockedRow} onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.manifest.id } })}>
              <BookCover story={s} width={54} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{s.manifest.title.sv}</AppText>
                <AppText variant="caption" tone="soft">
                  {s.quiz.filter((q) => (KNOWLEDGE as readonly string[]).includes(q.category)).length} history & culture questions
                </AppText>
              </View>
              <Icon name="lock" size={16} color={t.inkFaint} />
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
