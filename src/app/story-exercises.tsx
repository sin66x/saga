import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Button, Card } from '@/components/ui';
import { useStory } from '@/content/ContentProvider';
import { recordExercise } from '@/db/repos/results';
import { ExerciseSession } from '@/features/exercises/ExerciseSession';
import { getTopic } from '@/features/grammar';
import { Rich } from '@/features/grammar/LessonView';
import { space } from '@/theme/tokens';

/** Grammar exercises that come with a story package (exercises/grammar.json). */
export default function StoryExercisesScreen() {
  const { story: storyId, set: setId } = useLocalSearchParams<{ story: string; set: string }>();
  const story = useStory(storyId);
  const db = useSQLiteContext();
  const [started, setStarted] = useState(false);
  const set = story?.exerciseSets.find((s) => s.id === setId);

  if (!story || !set) {
    return (
      <Screen back="back" title="Not found">
        <AppText>These exercises are not available.</AppText>
      </Screen>
    );
  }
  const related = set.grammarTopic ? getTopic(set.grammarTopic) : undefined;

  if (started) {
    return (
      <ExerciseSession
        title={set.title.en}
        items={set.exercises.map((e) => ({ key: e.id, exercise: e, tag: story.manifest.title.sv }))}
        onAnswer={(item, correct) => recordExercise(db, 'story-grammar', `${story.manifest.id}/${set.id}`, item.exercise.id, correct)}
      />
    );
  }

  return (
    <Screen back="back" kicker={story.manifest.title.sv} title={set.title.sv} subtitle={set.title.en}>
      {set.explanation ? <Rich text={set.explanation} /> : null}
      <Button title="Start" icon="practice" onPress={() => setStarted(true)} />
      {related ? (
        <Card style={{ gap: space.sm }} onPress={() => router.push({ pathname: '/grammar/[topic]', params: { topic: related.id } })}>
          <AppText variant="label" tone="accent">
            Related grammar lesson
          </AppText>
          <AppText variant="subheading">{related.title}</AppText>
          <AppText variant="caption" tone="soft">
            {related.summary}
          </AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
