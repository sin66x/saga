import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, IconButton } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { deleteWord, getWord, setLearned, updateWord } from '@/db/repos/vocabulary';
import { useDbQuery } from '@/db/useDbQuery';
import { formTables, headword, posLabel } from '@/features/dictionary/presentation';
import { STATUS_LABELS } from '@/features/vocabulary/srs';
import { FormsGrid } from '@/features/vocabulary/FormsGrid';
import { showAlert } from '@/lib/dialog';
import { speakSwedish } from '@/lib/speech';
import { describeInterval, formatShortDate } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const db = useSQLiteContext();
  const { getStory } = useContent();
  const { data: item } = useDbQuery((db) => getWord(db, id), ['vocabulary'], id);
  // Drafts are null until the learner edits a field.
  const [notesDraft, setNotes] = useState<string | null>(null);
  const [translationDraft, setTranslation] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  if (!item) {
    return (
      <Screen back="close">
        <AppText tone="soft">{item === null ? 'This word was deleted.' : 'Loading…'}</AppText>
      </Screen>
    );
  }
  const story = item.storyId ? getStory(item.storyId) : undefined;
  const page = story && item.pageId ? story.pages.find((p) => p.id === item.pageId) : undefined;
  const tables = formTables(item.pos, item.forms, item.gender, item.lemma);
  const notes = notesDraft ?? item.notes ?? '';
  const translation = translationDraft ?? item.translation;
  const days = (new Date(item.dueAt).getTime() - now) / 86_400_000;
  const dirty = notes !== (item.notes ?? '') || translation !== item.translation;

  return (
    <Screen back="close" right={<IconButton name="speaker" label="Pronounce" onPress={() => speakSwedish(item.lemma)} filled />}>
      <View style={{ gap: space.sm }}>
        <AppText variant="hero" style={{ fontSize: 40, lineHeight: 46 }}>
          {item.pos === 'unknown' ? item.word : headword({ lemma: item.lemma, pos: item.pos, gender: item.gender ?? undefined })}
        </AppText>
        <View style={styles.chips}>
          <Chip label={item.pos === 'unknown' ? 'Word' : posLabel(item.pos)} color={t.blue} />
          <Chip label={STATUS_LABELS[item.status].en} />
          {item.word.toLowerCase() !== item.lemma.toLowerCase() ? <Chip label={`seen as “${item.word}”`} /> : null}
        </View>
      </View>

      <Card style={{ gap: space.sm }}>
        <AppText variant="label" tone="faint">
          English
        </AppText>
        <TextInput
          value={translation}
          onChangeText={setTranslation}
          placeholder="Add a translation"
          placeholderTextColor={t.inkFaint}
          style={{ fontFamily: fonts.readMedium, fontSize: 22, color: t.ink }}
          multiline
          accessibilityLabel="Translation"
        />
      </Card>

      {tables.length ? <FormsGrid tables={tables} /> : null}

      {item.sentence ? (
        <Card style={{ gap: space.sm }} onPress={story && page ? () => router.push({ pathname: '/read/[id]', params: { id: story.manifest.id, page: String(page.index) } }) : undefined}>
          <View style={styles.rowBetween}>
            <AppText variant="label" tone="faint">
              {story ? `From “${story.manifest.title.sv}”${page ? ` · page ${page.number}` : ''}` : 'Sentence'}
            </AppText>
            {story && page ? <Icon name="forward" size={13} color={t.inkFaint} /> : null}
          </View>
          <AppText variant="readingItalic" style={{ fontSize: 18, lineHeight: 27 }}>
            “{item.sentence}”
          </AppText>
        </Card>
      ) : null}

      <Card style={{ gap: space.sm }}>
        <AppText variant="label" tone="faint">
          My notes
        </AppText>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Write a note, a memory trick or your own example…"
          placeholderTextColor={t.inkFaint}
          multiline
          style={[styles.notes, { color: t.ink, backgroundColor: t.surfaceAlt }]}
          accessibilityLabel="Notes"
        />
        {dirty ? (
          <Button
            title="Save changes"
            compact
            onPress={async () => {
              await updateWord(db, item.id, { notes: notes || null, translation });
              setNotes(null);
              setTranslation(null);
            }}
          />
        ) : null}
      </Card>

      <Card style={{ gap: space.md }}>
        <View style={styles.rowBetween}>
          <AppText tone="soft">Added</AppText>
          <AppText variant="bodyStrong">{formatShortDate(item.createdAt)}</AppText>
        </View>
        <View style={styles.rowBetween}>
          <AppText tone="soft">Next review</AppText>
          <AppText variant="bodyStrong">{days <= 0 ? 'now' : `in ${describeInterval(days)}`}</AppText>
        </View>
        <View style={styles.rowBetween}>
          <AppText tone="soft">Correct in a row</AppText>
          <AppText variant="bodyStrong">{item.repetitions}</AppText>
        </View>
      </Card>

      <View style={{ gap: space.sm }}>
        {item.status === 'mastered' ? (
          <Button title="Practise again (reset)" icon="repeat" kind="secondary" onPress={() => setLearned(db, item, false)} />
        ) : (
          <Button title="Mark as learned" icon="check" kind="soft" onPress={() => setLearned(db, item, true)} />
        )}
        <Button
          title="Remove from My Words"
          icon="trash"
          kind="danger"
          onPress={() =>
            showAlert('Remove this word?', 'Its review history will be deleted.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  await deleteWord(db, item.id);
                  router.back();
                },
              },
            ])
          }
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  notes: { minHeight: 90, borderRadius: radius.md, padding: space.md, fontFamily: fonts.ui, fontSize: 16, textAlignVertical: 'top' },
});
