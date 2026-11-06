/**
 * A grammar topic: short explanation in simple English → Swedish examples → practice
 * with immediate feedback and explanations → summary.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, ProgressBar } from '@/components/ui';
import { getTopicStats, recordExercise } from '@/db/repos/results';
import { useDbQuery } from '@/db/useDbQuery';
import { ExerciseSession } from '@/features/exercises/ExerciseSession';
import { CATEGORIES, getTopic, GRAMMAR_TOPICS } from '@/features/grammar';
import { LessonView } from '@/features/grammar/LessonView';
import { useTheme } from '@/theme/ThemeContext';
import { space } from '@/theme/tokens';

export default function GrammarTopicScreen() {
  const { topic: topicId } = useLocalSearchParams<{ topic: string }>();
  const topic = getTopic(topicId);
  const t = useTheme();
  const db = useSQLiteContext();
  const [practising, setPractising] = useState(false);
  const { data: stats } = useDbQuery((db) => getTopicStats(db, 'grammar'), ['results'], topicId);

  if (!topic) {
    return (
      <Screen back="back" title="Topic not found">
        <AppText>Unknown grammar topic.</AppText>
      </Screen>
    );
  }

  if (practising) {
    const items = [...topic.exercises]
      .sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1))
      .map((e) => ({ key: e.id, exercise: e, tag: topic.titleSv }));
    return (
      <ExerciseSession
        title={topic.title}
        items={items}
        onAnswer={(item, correct) => recordExercise(db, 'grammar', topic.id, item.exercise.id, correct)}
        finishLabel="Back to the lesson"
      />
    );
  }

  const s = stats?.[topic.id];
  const idx = GRAMMAR_TOPICS.findIndex((x) => x.id === topic.id);
  const next = GRAMMAR_TOPICS[idx + 1];
  const category = CATEGORIES.find((c) => c.id === topic.category);

  return (
    <Screen back="back" kicker={`${category?.titleSv} · ${topic.level}`} title={topic.title} subtitle={topic.titleSv}>
      {s ? (
        <Card style={{ gap: space.sm }}>
          <AppText variant="caption" tone="soft">
            {s.mastered} of {topic.exercises.length} exercises answered correctly · {Math.round((s.correct / s.attempts) * 100)}% correct overall
          </AppText>
          <ProgressBar value={s.mastered / topic.exercises.length} color={t.green} />
        </Card>
      ) : null}

      <LessonView blocks={topic.lesson} />

      <View style={{ gap: space.md }}>
        <Button title={s ? 'Practise again' : 'Start practising'} icon="practice" onPress={() => setPractising(true)} />
        <View style={styles.chips}>
          <Chip label={`${topic.exercises.length} exercises`} />
          <Chip label="Explanations for every answer" />
        </View>
        {next ? <Button title={`Next: ${next.title}`} kind="ghost" onPress={() => router.replace({ pathname: '/grammar/[topic]', params: { topic: next.id } })} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' } });
