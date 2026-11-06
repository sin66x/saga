/**
 * The reader: a paginated, illustrated book. Swipe or tap the arrows to turn pages,
 * long-press any word for the dictionary.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FlatList, type ListRenderItemInfo, type ListViewToken, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { BookCover } from '@/components/BookCover';
import { Icon } from '@/components/Icon';
import { Button, IconButton, ProgressBar, Touchable, useHaptics } from '@/components/ui';
import { useStory } from '@/content/ContentProvider';
import type { FlatPage, Story } from '@/content/types';
import { type Bookmark, getBookmarks, openStory, savePosition, toggleBookmark } from '@/db/repos/progress';
import { createResolver } from '@/features/dictionary/resolver';
import type { WordPress } from '@/features/reader/InteractiveText';
import { PageView, type Selection } from '@/features/reader/PageView';
import { ReaderSheet } from '@/features/reader/ReaderSheet';
import { useReadingTimer } from '@/features/reader/useReadingTimer';
import { type PopoverRequest, WordPopover } from '@/features/reader/WordPopover';
import { useSettings } from '@/features/settings/SettingsProvider';
import { currentSpeechRate, pageSpeechChunks, readAloud, reportSpeechProblem, stopSpeaking } from '@/lib/speech';
import { clamp } from '@/lib/util';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, space } from '@/theme/tokens';

type Item = FlatPage | { end: true; index: number };

const VIEWABILITY = { itemVisiblePercentThreshold: 60 };
const TOP_BAR = 52;
const BOTTOM_BAR = 64;

export default function ReaderScreen() {
  const { id, page: pageParam } = useLocalSearchParams<{ id: string; page?: string }>();
  const story = useStory(id);
  const t = useTheme();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const { settings } = useSettings();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Item>>(null);
  const { ping } = useReadingTimer(story?.manifest.id);

  const [initialIndex, setInitialIndex] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [popover, setPopover] = useState<PopoverRequest | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [menu, setMenu] = useState<null | 'contents' | 'words'>(null);
  // Read-aloud: which block of which page is being read (null = not reading).
  const [readingState, setReading] = useState<{ pageId: string; block: string } | null>(null);

  const resolver = useMemo(() => createResolver(story?.vocabulary ?? []), [story]);
  const items: Item[] = useMemo(() => (story ? [...story.pages, { end: true, index: story.pages.length }] : []), [story]);
  const total = story?.pages.length ?? 0;

  // Open the story and restore the reading position.
  useEffect(() => {
    if (!story) return;
    let alive = true;
    openStory(db, story.manifest.id, story.pages.length).then((progress) => {
      if (!alive) return;
      const requested = pageParam !== undefined ? Number(pageParam) : progress.currentPage;
      const start = Number.isFinite(requested) ? clamp(requested, 0, story.pages.length - 1) : 0;
      setIndex(start);
      setInitialIndex(start);
    });
    getBookmarks(db, story.manifest.id).then((b) => alive && setBookmarks(b));
    return () => {
      alive = false;
    };
  }, [story, db, pageParam]);

  // Persist position whenever the page changes.
  useEffect(() => {
    if (!story || initialIndex === null) return;
    const p = story.pages[index];
    if (p) void savePosition(db, story.manifest.id, index, p.id, story.pages.length);
    ping();
  }, [index, story, db, initialIndex, ping]);

  const onViewable = useCallback(({ viewableItems }: { viewableItems: ListViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index !== undefined && first.index !== null) setIndex(first.index);
  }, []);

  // Reading always belongs to one page: stop when the page changes or the reader closes.
  const currentPageId = story?.pages[index]?.id;
  const reading = readingState && readingState.pageId === currentPageId ? readingState : null;
  const staleReading = !!readingState && !reading;
  useEffect(() => {
    if (staleReading) stopSpeaking();
  }, [staleReading]);
  useEffect(() => () => stopSpeaking(), []);
  const stopReading = useCallback(() => {
    stopSpeaking();
    setReading(null);
  }, []);

  const toggleReading = useCallback(() => {
    const page = story?.pages[index];
    if (!page) return;
    ping();
    if (reading) {
      stopReading();
      return;
    }
    const chunks = pageSpeechChunks(page);
    if (!chunks.length) return;
    haptics.light();
    setReading({ pageId: page.id, block: chunks[0].block });
    void readAloud(chunks, currentSpeechRate(), {
      onChunk: (c) => setReading({ pageId: page.id, block: c.block }),
      onDone: () => setReading(null),
      onError: (code) => {
        setReading(null);
        reportSpeechProblem(code);
      },
    });
  }, [story, index, reading, haptics, ping, stopReading]);

  const goTo = useCallback(
    (i: number, animated = true) => {
      const clamped = clamp(i, 0, items.length - 1);
      listRef.current?.scrollToIndex({ index: clamped, animated });
      setIndex(clamped);
      haptics.selection();
    },
    [items.length, haptics],
  );

  // `onWord` is handed to every word of every mounted page. It reads the changing values from a ref so that
  // its identity stays the same, and turning a page doesn't re-render the words of the neighbouring pages.
  const latest = useRef({ story, index, resolver, reading });
  useLayoutEffect(() => {
    latest.current = { story, index, resolver, reading };
  });
  const onWord = useCallback(
    (w: WordPress, block: string) => {
      const { story: st, index: idx, resolver: res, reading: isReading } = latest.current;
      const p = st?.pages[idx];
      if (!st || !p) return;
      ping();
      haptics.light();
      const lookup = res.resolve(w.word, { previousWord: w.previousWord, nextWord: w.nextWord });
      if (isReading) stopReading();
      setSelection({ pageId: p.id, block, token: w.tokenIndex });
      setPopover({ id: `${p.id}-${block}-${w.tokenIndex}-${lookup.surface}`, lookup, x: w.pageX, y: w.pageY, sentence: w.sentence, storyId: st.manifest.id, pageId: p.id });
    },
    [haptics, ping, stopReading],
  );
  const getItemLayout = useCallback((_: unknown, i: number) => ({ length: width, offset: width * i, index: i }), [width]);

  if (!story) {
    return (
      <View style={[styles.center, { backgroundColor: t.background }]}>
        <AppText variant="heading">Story not found</AppText>
        <Button title="Back to library" onPress={() => router.back()} />
      </View>
    );
  }

  const current = story.pages[index];
  const isBookmarked = !!current && bookmarks.some((b) => b.pageId === current.id);
  const chapter = current ? story.manifest.chapters[current.chapterIndex] : undefined;
  const accent = story.manifest.theme?.accent ?? t.accent;
  const topInset = insets.top + TOP_BAR;
  const bottomInset = insets.bottom + BOTTOM_BAR;

  const renderItem = ({ item }: ListRenderItemInfo<Item>) =>
    'end' in item ? (
      <EndPage story={story} width={width} height={height} topInset={topInset} />
    ) : (
      <PageView
        story={story}
        page={item}
        width={width}
        height={height}
        size={settings.readerSize}
        englishHelp={settings.englishHelp}
        selection={selection?.pageId === item.id ? selection : null}
        speakingBlock={reading && reading.pageId === item.id ? reading.block : null}
        onWord={onWord}
        topInset={topInset}
        bottomInset={bottomInset}
      />
    );

  return (
    <View style={[styles.flex, { backgroundColor: t.paper }]}>
      {initialIndex !== null ? (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) => ('end' in it ? 'end' : it.id)}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={VIEWABILITY}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          removeClippedSubviews
          extraData={`${selection?.pageId}-${selection?.block}-${selection?.token}-${settings.readerSize}-${settings.englishHelp}-${reading?.pageId}-${reading?.block}`}
          onScrollBeginDrag={() => {
            ping();
            setSelection(null);
          }}
        />
      ) : null}

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
        <IconButton name="close" label="Close book" onPress={() => router.back()} filled />
        <View style={styles.topTitle} pointerEvents="none">
          {chapter ? (
            <AppText variant="label" numberOfLines={1} style={{ color: accent, backgroundColor: t.paper, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' }}>
              {chapter.title.sv}
            </AppText>
          ) : null}
        </View>
        {current ? (
          <IconButton
            name={isBookmarked ? 'bookmarkFill' : 'bookmark'}
            label={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
            color={isBookmarked ? t.accent : t.ink}
            filled
            onPress={async () => {
              await toggleBookmark(db, story.manifest.id, current.id, current.index);
              haptics.soft();
              setBookmarks(await getBookmarks(db, story.manifest.id));
            }}
          />
        ) : null}
        <IconButton name="list" label="Contents, text size and words" onPress={() => setMenu('contents')} filled />
      </View>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 6, backgroundColor: t.paper, borderColor: t.line }]}>
        <IconButton name="back" label="Previous page" onPress={() => goTo(index - 1)} color={index === 0 ? t.inkFaint : t.ink} />
        <View style={styles.progress}>
          <ProgressBar value={Math.min(1, (index + 1) / total)} color={accent} height={4} />
          <AppText variant="caption" tone="soft" align="center" style={{ fontFamily: fonts.uiSemi }}>
            {index < total ? `Sida ${index + 1} av ${total}` : 'Slut'}
          </AppText>
        </View>
        {current ? (
          <Touchable
            onPress={toggleReading}
            accessibilityRole="button"
            accessibilityLabel={reading ? 'Stop reading aloud' : 'Read this page aloud'}
            style={[styles.playButton, { backgroundColor: accent }]}>
            <Icon name={reading ? 'stop' : 'play'} size={18} color="#FFFFFF" />
          </Touchable>
        ) : null}
        <IconButton name="forward" label="Next page" onPress={() => goTo(index + 1)} color={index >= items.length - 1 ? t.inkFaint : t.ink} />
      </View>

      {popover ? (
        <WordPopover
          key={popover.id}
          request={popover}
          onClose={() => {
            setPopover(null);
            setSelection(null);
          }}
        />
      ) : null}

      <ReaderSheet
        key={menu ?? 'closed'}
        visible={menu !== null}
        initialTab={menu ?? 'contents'}
        onClose={() => setMenu(null)}
        story={story}
        page={current}
        currentIndex={index}
        bookmarks={bookmarks}
        resolver={resolver}
        onJump={(i) => {
          setMenu(null);
          setTimeout(() => goTo(i, false), 250);
        }}
      />
    </View>
  );
}

function EndPage({ story, width, height, topInset }: { story: Story; width: number; height: number; topInset: number }) {
  const storyId = story.manifest.id;
  const hasQuiz = story.quiz.length > 0;
  return (
    <View style={[styles.end, { width, height, paddingTop: topInset + space.xl }]}>
      <BookCover story={story} width={Math.min(170, width * 0.42)} />
      <AppText variant="hero" align="center" style={{ fontSize: 44, lineHeight: 50, marginTop: space.lg }}>
        Slut
      </AppText>
      <AppText tone="soft" align="center">
        The end. Bra jobbat – well done!
      </AppText>
      <View style={{ gap: space.md, width: '100%', maxWidth: 360, marginTop: space.lg }}>
        {hasQuiz ? <Button title="Take the quiz" icon="graduation" onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: storyId } })} /> : null}
        <Button title="Practise the words" icon="cards" kind="secondary" onPress={() => router.push({ pathname: '/vocab-practice', params: { story: storyId } })} />
        <Button title="Back to the book" kind="ghost" onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  topBar: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  topTitle: { flex: 1, alignItems: 'center' },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  progress: { flex: 1, gap: 6 },
  playButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  end: { alignItems: 'center', paddingHorizontal: space.xxl, gap: space.sm },
});
