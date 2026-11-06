import { useSQLiteContext } from 'expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { EmptyState } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { recordExercise } from '@/db/repos/results';
import { listDifficult, listWords, reviewWord, type VocabItem } from '@/db/repos/vocabulary';
import { getBaseDictionary } from '@/features/dictionary/dictionary';
import { ExerciseSession, type SessionItem } from '@/features/exercises/ExerciseSession';
import { buildSession, type PracticeWord, type VocabExercise } from '@/features/vocabulary/exerciseGenerator';
import { gradeFromAnswer } from '@/features/vocabulary/srs';
import { sample } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';

const toPractice = (w: VocabItem): PracticeWord => ({ id: w.id, word: w.word, lemma: w.lemma, pos: w.pos, translation: w.translation, gender: w.gender, sentence: w.sentence });

export default function VocabPracticeScreen() {
  const { mode, story: storyId } = useLocalSearchParams<{ mode?: string; story?: string }>();
  const t = useTheme();
  const db = useSQLiteContext();
  const { getStory } = useContent();
  const [session, setSession] = useState<{ items: SessionItem[]; meta: Map<string, VocabExercise>; byId: Map<string, VocabItem> } | null>(null);

  useEffect(() => {
    (async () => {
      const all = await listWords(db);
      const byId = new Map(all.map((w) => [w.id, w]));
      let targets: PracticeWord[];
      if (mode === 'difficult') {
        targets = (await listDifficult(db)).map(toPractice);
      } else if (storyId) {
        const saved = all.filter((w) => w.storyId === storyId).map(toPractice);
        const story = getStory(storyId);
        const fromStory: PracticeWord[] = (story?.vocabulary ?? [])
          .filter((v) => !saved.some((s) => s.lemma === v.lemma))
          .map((v) => ({ id: `story:${v.lemma}:${v.pos}`, word: v.lemma, lemma: v.lemma, pos: v.pos, translation: v.en, gender: v.gender, sentence: v.example?.sv ?? null }));
        targets = [...saved, ...fromStory];
      } else {
        // Due words first, then the rest by how soon they are due.
        targets = [...all].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).map(toPractice);
      }
      const dict = getBaseDictionary().entries.filter((e) => ['noun', 'verb', 'adjective'].includes(e.pos));
      const extras = sample(dict, 60);
      const built = buildSession(sample(targets.slice(0, 30), Math.min(30, targets.length)), [...all.map(toPractice), ...targets], {
        size: 10,
        extras: extras.map((e) => ({ id: `dict:${e.lemma}:${e.pos}`, word: e.lemma, lemma: e.lemma, pos: e.pos, translation: e.en, gender: e.gender })),
      });
      const meta = new Map<string, VocabExercise>();
      const items: SessionItem[] = built.map((b, i) => {
        const key = `${b.exercise.id}-${i}`;
        meta.set(key, b);
        return { key, exercise: b.exercise, tag: b.mode === 'match' ? 'Matcha' : b.mode === 'cloze' ? 'Från berättelsen' : b.mode === 'identify' ? 'Hitta ordet' : 'Ordförråd' };
      });
      setSession({ items, meta, byId });
    })();
  }, [db, mode, storyId, getStory]);

  if (!session) return <View style={{ flex: 1, backgroundColor: t.background }} />;
  if (!session.items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, justifyContent: 'center' }}>
        <EmptyState
          icon="vocabulary"
          title={mode === 'difficult' ? 'No difficult words' : 'Not enough words yet'}
          message={mode === 'difficult' ? 'Words you forget during review will show up here.' : 'Save a few words while reading (long-press a word) and come back to practise them.'}
          action="Back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  return (
    <ExerciseSession
      title={mode === 'difficult' ? 'Difficult words' : storyId ? `Words from ${getStory(storyId)?.manifest.title.sv ?? 'the story'}` : 'My words'}
      items={session.items}
      onAnswer={async (item, correct) => {
        const ex = session.meta.get(item.key);
        if (!ex) return;
        for (const id of ex.wordIds) {
          const word = session.byId.get(id);
          if (word) await reviewWord(db, word, gradeFromAnswer(correct), ex.mode);
        }
        await recordExercise(db, 'vocab', storyId ?? 'my-words', ex.exercise.id, correct);
      }}
    />
  );
}
