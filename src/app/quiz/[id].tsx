import { useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useRef } from 'react';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { useStory } from '@/content/ContentProvider';
import { type QuizAnswer, saveQuizAttempt } from '@/db/repos/results';
import { ExerciseSession } from '@/features/exercises/ExerciseSession';
import { CATEGORY_LABELS, QuizFeedback } from '@/features/quiz/QuizFeedback';
import { nowIso } from '@/lib/util';

/** A story's quiz: questions go from simple facts to a little interpretation. */
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = useStory(id);
  const db = useSQLiteContext();
  const startedAt = useRef(nowIso()).current;
  const answers = useRef<QuizAnswer[]>([]);

  const items = useMemo(
    () =>
      (story?.quiz ?? [])
        .map((q, i) => ({ q, i }))
        .sort((a, b) => (a.q.difficulty ?? 1) - (b.q.difficulty ?? 1) || a.i - b.i)
        .map(({ q }) => ({ key: q.id, exercise: q, tag: CATEGORY_LABELS[q.category] })),
    [story],
  );

  if (!story) {
    return (
      <Screen back="back" title="Quiz not found">
        <AppText>This story has no quiz.</AppText>
      </Screen>
    );
  }

  return (
    <ExerciseSession
      title={`Quiz · ${story.manifest.title.sv}`}
      items={items}
      onAnswer={(item, correct) => {
        answers.current.push({ storyId: story.manifest.id, questionId: item.exercise.id, correct });
      }}
      onFinish={() => saveQuizAttempt(db, story.manifest.id, startedAt, answers.current)}
      renderFeedbackExtra={(item) => {
        const q = story.quiz.find((x) => x.id === item.exercise.id);
        return q ? <QuizFeedback question={q} story={story} /> : null;
      }}
      finishLabel="Back to the book"
    />
  );
}
