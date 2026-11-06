import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Button, Chip, EmptyState, Touchable } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { listWords, type VocabItem } from '@/db/repos/vocabulary';
import { useDbQuery } from '@/db/useDbQuery';
import { headword, posLabel } from '@/features/dictionary/presentation';
import { type LearningStatus, STATUS_LABELS, STATUSES } from '@/features/vocabulary/srs';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, learningStateColors, radius, space } from '@/theme/tokens';

type Sort = 'recent' | 'az' | 'due';
const TYPES = ['noun', 'verb', 'adjective', 'other'] as const;

export default function VocabularyScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { stories, getStory } = useContent();
  const { data: words } = useDbQuery(listWords, ['vocabulary']);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<LearningStatus | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number] | null>(null);
  const [story, setStory] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('recent');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = (words ?? []).filter((w) => {
      if (q && !w.lemma.toLowerCase().includes(q) && !w.word.toLowerCase().includes(q) && !w.translation.toLowerCase().includes(q)) return false;
      if (status && w.status !== status) return false;
      if (type && (type === 'other' ? ['noun', 'verb', 'adjective'].includes(w.pos) : w.pos !== type)) return false;
      if (story && w.storyId !== story) return false;
      return true;
    });
    if (sort === 'az') list = [...list].sort((a, b) => a.lemma.localeCompare(b.lemma, 'sv'));
    if (sort === 'due') list = [...list].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
    return list;
  }, [words, query, status, type, story, sort]);

  const statusColor: Record<LearningStatus, string> = learningStateColors[t.scheme];
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const w of words ?? []) c[w.status] = (c[w.status] ?? 0) + 1;
    return c;
  }, [words]);
  const due = (words ?? []).filter((w) => new Date(w.dueAt) <= new Date()).length;

  const header = (
    <View style={{ gap: space.lg, paddingTop: insets.top + space.xl, paddingBottom: space.md }}>
      <View>
        <AppText variant="label" tone="accent">
          Mina ord
        </AppText>
        <AppText variant="hero" accessibilityRole="header">
          My Words
        </AppText>
        <AppText tone="soft">
          {words?.length ?? 0} saved · {counts.mastered ?? 0} mastered · {due} to review
        </AppText>
      </View>

      {words?.length ? (
        <View style={styles.actions}>
          <Button title={due ? `Review ${due} due` : 'Nothing due'} icon="cards" compact disabled={!due} onPress={() => router.push('/review')} style={{ flex: 1 }} />
          <Button title="Practise" icon="practice" compact kind="secondary" onPress={() => router.push('/vocab-practice')} style={{ flex: 1 }} />
          <Button title="Difficult" icon="brain" compact kind="secondary" onPress={() => router.push({ pathname: '/vocab-practice', params: { mode: 'difficult' } })} style={{ flex: 1 }} />
        </View>
      ) : null}

      <View style={[styles.search, { backgroundColor: t.surface, borderColor: t.line }]}>
        <Icon name="search" size={17} color={t.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search Swedish or English"
          placeholderTextColor={t.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          style={{ flex: 1, fontFamily: fonts.ui, fontSize: 16, color: t.ink, paddingVertical: 10 }}
          accessibilityLabel="Search words"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {STATUSES.map((s) => (
          <Chip key={s} label={`${STATUS_LABELS[s].en} ${counts[s] ?? 0}`} selected={status === s} color={statusColor[s]} onPress={() => setStatus(status === s ? null : s)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {TYPES.map((ty) => (
          <Chip key={ty} label={ty === 'other' ? 'Other' : posLabel(ty)} selected={type === ty} onPress={() => setType(type === ty ? null : ty)} />
        ))}
        <View style={[styles.sep, { backgroundColor: t.line }]} />
        {stories.map((s) => (
          <Chip key={s.manifest.id} label={s.manifest.title.sv} selected={story === s.manifest.id} onPress={() => setStory(story === s.manifest.id ? null : s.manifest.id)} />
        ))}
      </ScrollView>
      <View style={styles.sortRow}>
        <AppText variant="caption" tone="faint">
          Sort:
        </AppText>
        {(['recent', 'az', 'due'] as Sort[]).map((s) => (
          <Touchable key={s} onPress={() => setSort(s)} hitSlop={6}>
            <AppText variant="caption" style={{ fontFamily: sort === s ? fonts.uiHeavy : fonts.ui, color: sort === s ? t.accent : t.inkSoft }}>
              {s === 'recent' ? 'Recently added' : s === 'az' ? 'A–Ö' : 'Next review'}
            </AppText>
          </Touchable>
        ))}
      </View>
    </View>
  );

  return (
    <FlatList
      style={{ backgroundColor: t.background }}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
      data={filtered}
      keyExtractor={(w) => w.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={{ height: space.sm }} />}
      ListEmptyComponent={
        words?.length ? (
          <EmptyState icon="search" title="No matches" message="Try another search or clear the filters." />
        ) : (
          <EmptyState icon="vocabulary" title="No words yet" message="While reading, long-press any word and tap “Add to My Words”. Your words will appear here with their grammar and story sentence." action="Open a book" onAction={() => router.push('/books')} />
        )
      }
      renderItem={({ item }) => <WordRow item={item} storyTitle={item.storyId ? getStory(item.storyId)?.manifest.title.sv : undefined} color={statusColor[item.status]} />}
    />
  );
}

function WordRow({ item, storyTitle, color }: { item: VocabItem; storyTitle?: string; color: string }) {
  const t = useTheme();
  return (
    <Touchable
      onPress={() => router.push({ pathname: '/word/[id]', params: { id: item.id } })}
      style={[styles.row, { backgroundColor: t.surface, borderColor: t.line }]}
      accessibilityLabel={`${item.lemma}, ${item.translation}, ${STATUS_LABELS[item.status].en}`}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontFamily: fonts.display, fontSize: 19, color: t.ink }}>
          {item.pos === 'unknown' ? item.word : headword({ lemma: item.lemma, pos: item.pos, gender: item.gender ?? undefined })}
        </AppText>
        <AppText tone="soft" numberOfLines={1}>
          {item.translation || 'no translation – add a note'}
        </AppText>
        <AppText variant="caption" tone="faint" numberOfLines={1}>
          {item.pos === 'unknown' ? 'Word' : posLabel(item.pos)}
          {storyTitle ? ` · ${storyTitle}` : ''}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <AppText variant="caption" style={{ color, fontFamily: fonts.uiBold }}>
          {STATUS_LABELS[item.status].en}
        </AppText>
        <Icon name="forward" size={13} color={t.inkFaint} />
      </View>
    </Touchable>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.xl, maxWidth: 720, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: space.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  filterRow: { gap: space.sm, paddingRight: space.xl },
  sep: { width: 1, marginHorizontal: 4 },
  sortRow: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
