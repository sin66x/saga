/**
 * Reader menu sheet: text size, chapters, bookmarks and "words on this page".
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useMemo, useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Chip, IconButton, Touchable, useHaptics } from '@/components/ui';
import type { FlatPage, Story } from '@/content/types';
import type { Bookmark } from '@/db/repos/progress';
import { saveWord } from '@/db/repos/vocabulary';
import type { Resolver } from '@/features/dictionary/resolver';
import { useSettings } from '@/features/settings/SettingsProvider';
import { tokenize } from '@/lib/tokenizer';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, readerSizes, type ReaderSize, space } from '@/theme/tokens';

type Tab = 'contents' | 'words';

interface Props {
  visible: boolean;
  onClose: () => void;
  story: Story;
  page: FlatPage | undefined;
  currentIndex: number;
  bookmarks: Bookmark[];
  resolver: Resolver;
  onJump: (index: number) => void;
  initialTab?: Tab;
}

export function ReaderSheet({ visible, onClose, story, page, currentIndex, bookmarks, resolver, onJump, initialTab = 'contents' }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { settings, update } = useSettings();
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.sheet, { backgroundColor: t.background, paddingBottom: insets.bottom }]}>
        <View style={styles.head}>
          <AppText variant="title" style={{ flex: 1 }}>
            {story.manifest.title.sv}
          </AppText>
          <IconButton name="close" label="Close menu" onPress={onClose} filled />
        </View>

        <View style={styles.sizeRow}>
          <Icon name="textformat" size={18} color={t.inkSoft} />
          <AppText variant="bodyStrong" style={{ flex: 1 }}>
            Text size
          </AppText>
          {(Object.keys(readerSizes) as ReaderSize[]).map((s) => (
            <Touchable
              key={s}
              onPress={() => update('readerSize', s)}
              accessibilityRole="button"
              accessibilityState={{ selected: settings.readerSize === s }}
              accessibilityLabel={`Text size ${s}`}
              style={[styles.sizeBtn, { backgroundColor: settings.readerSize === s ? t.accent : t.surfaceAlt }]}>
              <AppText style={{ fontFamily: fonts.display, fontSize: readerSizes[s].font - 3, color: settings.readerSize === s ? t.accentInk : t.ink }}>Aa</AppText>
            </Touchable>
          ))}
        </View>

        <View style={styles.tabs}>
          <Chip label="Contents" selected={tab === 'contents'} onPress={() => setTab('contents')} icon="list" />
          <Chip label="Words on this page" selected={tab === 'words'} onPress={() => setTab('words')} icon="translate" />
        </View>

        {tab === 'contents' ? (
          <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.xl }}>
            {bookmarks.length ? (
              <View style={{ gap: space.sm }}>
                <AppText variant="label" tone="accent">
                  Bookmarks
                </AppText>
                {bookmarks.map((b) => {
                  const p = story.pages.find((x) => x.id === b.pageId);
                  if (!p) return null;
                  return (
                    <Touchable key={b.pageId} onPress={() => onJump(p.index)} style={[styles.row, { backgroundColor: t.surface }]}>
                      <Icon name="bookmarkFill" size={16} color={t.accent} />
                      <AppText style={{ flex: 1 }} numberOfLines={1}>
                        Page {p.number} · {p.heading ?? p.paragraphs[0]?.slice(0, 40) + '…'}
                      </AppText>
                    </Touchable>
                  );
                })}
              </View>
            ) : null}
            {story.manifest.chapters.map((ch, ci) => {
              const pages = story.pages.filter((p) => p.chapterIndex === ci);
              const active = pages.some((p) => p.index === currentIndex);
              return (
                <View key={ch.id} style={{ gap: space.sm }}>
                  <Touchable onPress={() => onJump(pages[0].index)} style={styles.chapterHead}>
                    <AppText style={{ fontFamily: fonts.display, fontSize: 15, color: active ? t.accent : t.inkFaint }}>{ci + 1}</AppText>
                    <View style={{ flex: 1 }}>
                      <AppText variant="heading" style={{ fontSize: 19, color: active ? t.accent : t.ink }}>
                        {ch.title.sv}
                      </AppText>
                      <AppText variant="caption" tone="soft">
                        {ch.title.en} · pages {pages[0].number}–{pages[pages.length - 1].number}
                      </AppText>
                    </View>
                  </Touchable>
                  <View style={styles.pageDots}>
                    {pages.map((p) => (
                      <Touchable
                        key={p.id}
                        onPress={() => onJump(p.index)}
                        accessibilityLabel={`Go to page ${p.number}`}
                        style={[styles.pageDot, { backgroundColor: p.index === currentIndex ? t.accent : t.surfaceAlt }]}>
                        <AppText variant="caption" style={{ fontFamily: fonts.uiBold, color: p.index === currentIndex ? t.accentInk : t.inkSoft }}>
                          {p.number}
                        </AppText>
                      </Touchable>
                    ))}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        ) : (
          <WordsOnPage page={page} story={story} resolver={resolver} />
        )}
      </View>
    </Modal>
  );
}

/** Every distinct word on the current page with its translation – an accessible alternative to long-press. */
function WordsOnPage({ page, story, resolver }: { page: FlatPage | undefined; story: Story; resolver: Resolver }) {
  const t = useTheme();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    if (!page) return [];
    const seen = new Set<string>();
    const out: { word: string; lemma: string; en: string; sentence: string; lookup: ReturnType<Resolver['resolve']> }[] = [];
    const texts = [page.heading ?? '', ...page.paragraphs];
    for (const text of texts) {
      const tokens = tokenize(text);
      tokens.forEach((tok) => {
        if (tok.kind !== 'word') return;
        const key = tok.text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const lookup = resolver.resolve(tok.text);
        const sentence = tokens.filter((x) => x.sentence === tok.sentence).map((x) => x.text).join('').trim();
        out.push({ word: tok.text, lemma: lookup.hit?.entry.lemma ?? '', en: lookup.translation ?? '—', sentence, lookup });
      });
    }
    // Content words first: skip the most common function words to keep the list useful.
    return out.filter((r) => !['pronoun', 'conjunction', 'preposition', 'determiner'].includes(r.lookup.hit?.entry.pos ?? ''));
  }, [page, resolver]);

  if (!page) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm }}>
      <AppText variant="caption" tone="soft" style={{ marginBottom: space.sm }}>
        Page {page.number}. Tap + to save a word. (Small words like “och”, “i” and “han” are hidden.)
      </AppText>
      {rows.map((r) => {
        const entry = r.lookup.hit?.entry;
        const isSaved = saved.has(r.word.toLowerCase());
        return (
          <View key={r.word} style={[styles.wordRow, { backgroundColor: t.surface, borderColor: t.line }]}>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontFamily: fonts.readMedium, fontSize: 17, color: t.ink }}>
                {r.word}
                {entry && entry.lemma.toLowerCase() !== r.word.toLowerCase() ? <AppText variant="caption" tone="faint">{`  (${entry.lemma})`}</AppText> : null}
              </AppText>
              <AppText variant="caption" tone="soft">
                {r.en}
              </AppText>
            </View>
            {entry ? (
              <IconButton
                name={isSaved ? 'check' : 'plus'}
                label={isSaved ? `${r.word} saved` : `Save ${r.word}`}
                color={isSaved ? t.success : t.accent}
                onPress={async () => {
                  if (isSaved) return;
                  await saveWord(db, {
                    word: r.word, lemma: entry.lemma, pos: entry.pos, translation: entry.en, gender: entry.gender ?? null,
                    forms: entry.forms ?? null, sentence: r.sentence, storyId: story.manifest.id, pageId: page.id,
                  });
                  haptics.success();
                  setSaved((s) => new Set(s).add(r.word.toLowerCase()));
                }}
              />
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'center', padding: space.xl, paddingBottom: space.md },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.xl, paddingVertical: space.sm },
  sizeBtn: { width: 46, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.xl, paddingTop: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  chapterHead: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  pageDots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingLeft: 26 },
  pageDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  wordRow: { flexDirection: 'row', alignItems: 'center', padding: space.md, paddingLeft: space.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
});
