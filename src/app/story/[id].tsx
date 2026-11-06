import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, IconButton, ProgressBar, SectionHeader, Touchable, useHaptics } from '@/components/ui';
import { useContent, useStory } from '@/content/ContentProvider';
import { chapterStarts, storyWordCount } from '@/content/story';
import { getProgress, restartStory } from '@/db/repos/progress';
import { getQuizStats, getTopicStats } from '@/db/repos/results';
import { findSaved, saveWord } from '@/db/repos/vocabulary';
import { useDbQuery } from '@/db/useDbQuery';
import { headword, posLabel } from '@/features/dictionary/presentation';
import { buildStoryPackage, deleteImportedStory } from '@/features/import/importer';
import { showAlert } from '@/lib/dialog';
import { shareFile } from '@/lib/files';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = useStory(id);
  const { reload } = useContent();
  const t = useTheme();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const { data, reload: reloadData } = useDbQuery(
    async (db) => {
      const [progress, quiz, topics] = await Promise.all([getProgress(db, id), getQuizStats(db), getTopicStats(db, 'story-grammar')]);
      const keyWords = story ? story.vocabulary.filter((v) => v.key) : [];
      const saved = new Set<string>();
      for (const k of keyWords) if (await findSaved(db, k.lemma, k.pos)) saved.add(`${k.lemma}|${k.pos}`);
      return { progress, quiz: quiz[id], topics, saved };
    },
    ['progress', 'results', 'vocabulary'],
    id,
  );

  if (!story) {
    return (
      <Screen back="back" title="Not found">
        <AppText>This story is not in your library.</AppText>
      </Screen>
    );
  }
  const m = story.manifest;
  const accent = m.theme?.accent ?? t.accent;
  const progress = data?.progress;
  const ratio = progress ? (progress.completedAt ? 1 : (progress.furthestPage + 1) / story.pages.length) : 0;
  const starts = chapterStarts(story);
  const keyWords = story.vocabulary.filter((v) => v.key);

  const read = (page?: number) => router.push({ pathname: '/read/[id]', params: page !== undefined ? { id: m.id, page: String(page) } : { id: m.id } });

  const share = async () => {
    try {
      setBusy(true);
      shareFile(`${m.id}.zip`, await buildStoryPackage(story));
    } catch (e) {
      showAlert('Export failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    showAlert('Delete this story?', 'The story files are removed from this iPhone. Your saved words and quiz results are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteImportedStory(db, m.id);
          await reload();
          router.back();
        },
      },
    ]);

  return (
    <Screen back="back" right={<IconButton name="share" label="Export story package" onPress={share} filled />}>
      <View style={styles.hero}>
        <BookCover story={story} width={Math.min(190, width * 0.48)} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <AppText variant="hero" align="center">
            {m.title.sv}
          </AppText>
          <AppText variant="swedish" tone="soft" align="center">
            {m.title.en}
          </AppText>
        </View>
        <View style={styles.chips}>
          <Chip label={m.level.cefr} color={accent} />
          <Chip icon="clock" label={`${m.estimatedReadingMinutes} min`} />
          <Chip icon="book" label={`${story.pages.length} pages`} />
          <Chip label={`${storyWordCount(story)} words`} />
        </View>
      </View>

      <View style={{ gap: space.md }}>
        <AppText variant="reading" style={{ fontSize: 17, lineHeight: 26 }}>
          {m.description.sv}
        </AppText>
        <AppText tone="soft">{m.description.en}</AppText>
        {m.accuracyNote ? (
          <View style={[styles.note, { backgroundColor: t.blueSoft }]}>
            <Icon name="info" size={16} color={t.blue} />
            <AppText variant="caption" style={{ flex: 1 }}>
              {m.accuracyNote.en}
            </AppText>
          </View>
        ) : null}
      </View>

      <Card style={{ gap: space.md }}>
        {progress ? (
          <>
            <View style={{ gap: 6 }}>
              <ProgressBar value={ratio} color={accent} height={8} />
              <AppText variant="caption" tone="soft">
                {progress.completedAt ? 'You have finished this story. Läs igen?' : `Page ${progress.currentPage + 1} of ${story.pages.length}`}
              </AppText>
            </View>
            <Button title={progress.completedAt ? 'Read again' : 'Continue reading'} icon="play" style={{ backgroundColor: accent }} onPress={() => read()} />
            {progress.currentPage > 0 ? (
              <Button
                title="Start from the beginning"
                kind="ghost"
                onPress={async () => {
                  await restartStory(db, m.id);
                  read(0);
                }}
              />
            ) : null}
          </>
        ) : (
          <Button title="Start reading" icon="play" style={{ backgroundColor: accent }} onPress={() => read(0)} />
        )}
      </Card>

      <View>
        <SectionHeader title="Chapters" subtitle="Kapitel" />
        <View style={{ gap: space.sm }}>
          {m.chapters.map((ch, i) => (
            <Touchable key={ch.id} onPress={() => read(starts[ch.id])} style={[styles.chapter, { backgroundColor: t.surface, borderColor: t.line }]}>
              <AppText style={{ fontFamily: fonts.display, fontSize: 22, color: accent, width: 28 }}>{i + 1}</AppText>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{ch.title.sv}</AppText>
                <AppText variant="caption" tone="soft">
                  {ch.title.en} · {ch.pages.length} pages
                </AppText>
              </View>
              <Icon name="forward" size={14} color={t.inkFaint} />
            </Touchable>
          ))}
        </View>
      </View>

      {story.quiz.length ? (
        <Card tint={t.goldSoft} style={styles.row} onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: m.id } })} accessibilityLabel="Story quiz">
          <View style={[styles.roundIcon, { backgroundColor: t.gold }]}>
            <Icon name="graduation" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">Story quiz</AppText>
            <AppText variant="caption" tone="soft">
              {story.quiz.length} questions{data?.quiz ? ` · best ${data.quiz.best}/${data.quiz.bestTotal}` : ' · not taken yet'}
            </AppText>
          </View>
          <Icon name="forward" size={14} color={t.inkFaint} />
        </Card>
      ) : null}

      {story.exerciseSets.map((set) => {
        const s = data?.topics[`${m.id}/${set.id}`];
        return (
          <Card key={set.id} tint={t.greenSoft} style={styles.row} onPress={() => router.push({ pathname: '/story-exercises', params: { story: m.id, set: set.id } })} accessibilityLabel={set.title.en}>
            <View style={[styles.roundIcon, { backgroundColor: t.green }]}>
              <Icon name="pencil" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="subheading">{set.title.sv}</AppText>
              <AppText variant="caption" tone="soft">
                {set.title.en} · {set.exercises.length} exercises{s ? ` · ${s.mastered} done` : ''}
              </AppText>
            </View>
            <Icon name="forward" size={14} color={t.inkFaint} />
          </Card>
        );
      })}

      {keyWords.length ? (
        <View>
          <SectionHeader title="Key words" subtitle="Viktiga ord i berättelsen" />
          <View style={{ gap: space.sm }}>
            {keyWords.map((k) => {
              const saved = data?.saved.has(`${k.lemma}|${k.pos}`);
              return (
                <View key={`${k.lemma}-${k.pos}`} style={[styles.keyWord, { backgroundColor: t.surface, borderColor: t.line }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText style={{ fontFamily: fonts.readMedium, fontSize: 17, color: t.ink }}>{headword(k)}</AppText>
                    <AppText variant="caption" tone="soft">
                      {posLabel(k.pos)} · {k.en}
                    </AppText>
                  </View>
                  <IconButton
                    name={saved ? 'check' : 'plus'}
                    label={saved ? 'Saved' : `Save ${k.lemma}`}
                    color={saved ? t.success : t.accent}
                    onPress={async () => {
                      if (saved) return;
                      await saveWord(db, { word: k.lemma, lemma: k.lemma, pos: k.pos, translation: k.en, gender: k.gender ?? null, forms: k.forms ?? null, sentence: k.example?.sv ?? null, storyId: m.id });
                      haptics.success();
                      reloadData();
                    }}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={{ gap: space.sm }}>
        <AppText variant="caption" tone="faint" align="center">
          {m.author} · version {m.version} · {story.source === 'bundled' ? 'built-in story' : 'imported story'}
        </AppText>
        <Button title="Export as story package (.zip)" kind="secondary" icon="share" loading={busy} onPress={share} />
        {story.source === 'imported' ? <Button title="Delete this story" kind="danger" icon="trash" onPress={remove} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: space.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  note: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md },
  chapter: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 0 },
  roundIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  keyWord: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.sm, paddingHorizontal: space.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
});
