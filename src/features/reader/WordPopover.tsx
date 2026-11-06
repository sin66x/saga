/**
 * The dictionary popover shown after long-pressing a word in the reader.
 * It sits on the roomier side of the pressed word (see popoverLayout.ts), so the word
 * stays visible, and scrolls inside the card when the content is taller than the room.
 */
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Button, Chip, IconButton, useHaptics } from '@/components/ui';
import { findSaved, saveWord } from '@/db/repos/vocabulary';
import { englishForForm } from '@/features/dictionary/english';
import { formTables, headword, posLabel } from '@/features/dictionary/presentation';
import { labelFor } from '@/features/dictionary/resolver';
import type { FormHit, WordLookup } from '@/features/dictionary/types';
import { speakSwedish } from '@/lib/speech';
import { popoverLayout } from './popoverLayout';
import { useTheme } from '@/theme/ThemeContext';
import { cardShadow, fonts, radius, space } from '@/theme/tokens';
import { FormsGrid } from '../vocabulary/FormsGrid';

export interface PopoverRequest {
  id: string;
  lookup: WordLookup;
  x: number;
  y: number;
  sentence: string;
  storyId: string;
  pageId: string;
}

/** Render with `key={request.id}` so each lookup starts with fresh state. */
export function WordPopover({ request, onClose }: { request: PopoverRequest; onClose: () => void }) {
  const t = useTheme();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [hit, setHit] = useState<FormHit | undefined>(request.lookup.hit);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The popover opens while the finger that long-pressed the word is still down. Lifting it sends a click
  // to the backdrop, which must not close the popover: only a press that *started* on the backdrop may.
  const backdropArmed = useRef(false);

  useEffect(() => {
    let alive = true;
    const lemma = hit?.entry.lemma ?? request.lookup.surface.toLowerCase();
    findSaved(db, lemma, hit?.entry.pos ?? 'unknown')
      .then((s) => alive && setSavedId(s?.id ?? null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hit, request, db]);

  const { lookup } = request;
  const entry = hit?.entry;
  const isPrimary = hit === lookup.hit;
  const translation = isPrimary ? lookup.translation : hit ? englishForForm(hit.entry, hit.form, lookup.surface) : undefined;
  const formLabel = isPrimary ? lookup.formLabel : hit ? labelFor(hit, lookup.surface) : undefined;
  const alternatives = useMemo(() => [lookup.hit, ...lookup.alternatives].filter((h): h is FormHit => !!h && h !== hit), [lookup, hit]);

  // Placed on the roomier side of the word; tall content scrolls inside the card.
  const { below, width: cardWidth, left, top, bottom, maxHeight, arrowLeft } = popoverLayout({
    x: request.x,
    y: request.y,
    screenWidth: width,
    screenHeight: height,
    insetTop: insets.top,
    insetBottom: insets.bottom,
  });

  const save = async () => {
    setSaving(true);
    try {
      const res = await saveWord(db, {
        word: lookup.surface,
        lemma: entry?.lemma ?? lookup.surface.toLowerCase(),
        pos: entry?.pos ?? 'unknown',
        translation: entry?.en ?? '',
        gender: entry?.gender ?? null,
        forms: entry?.forms ?? null,
        sentence: request.sentence,
        storyId: request.storyId,
        pageId: request.pageId,
      });
      setSavedId(res.item.id);
      haptics.success();
    } finally {
      setSaving(false);
    }
  };

  const tables = useMemo(() => (entry ? formTables(entry.pos, entry.forms, entry.gender, entry.lemma) : []), [entry]);
  const notFound = lookup.status === 'not-found';

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable
        style={[StyleSheet.absoluteFill, { backgroundColor: t.overlay }]}
        onPressIn={() => {
          backdropArmed.current = true;
        }}
        onPress={() => {
          if (backdropArmed.current) onClose();
          backdropArmed.current = false;
        }}
        accessibilityLabel="Close dictionary"
      />
      <Animated.View
        entering={ZoomIn.duration(180)}
        style={[styles.card, { width: cardWidth, left, top, bottom, backgroundColor: t.paper, borderColor: t.line }, cardShadow(t, 2)]}>
        <View style={[styles.arrow, { left: arrowLeft, backgroundColor: t.paper, borderColor: t.line }, below ? styles.arrowTop : styles.arrowBottom]} />
        {/* The inner view clips the scrolling content to the rounded corners and caps the height. */}
        <View style={[styles.clip, { maxHeight }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: space.xl, gap: space.md }}
          showsVerticalScrollIndicator
          indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
          scrollIndicatorInsets={{ top: 12, bottom: 12 }}
          nestedScrollEnabled
          alwaysBounceVertical={false}
          scrollsToTop={false}>
          {/* Header */}
          <View style={styles.headRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="title" style={{ fontSize: 30, lineHeight: 36 }} selectable>
                {lookup.surface}
              </AppText>
              {entry && entry.lemma.toLowerCase() !== lookup.surface.toLowerCase() ? (
                <AppText variant="caption" tone="soft">
                  Base form · <AppText variant="caption" style={{ fontFamily: fonts.uiBold, color: t.ink }}>{headword(entry)}</AppText>
                </AppText>
              ) : entry ? (
                <AppText variant="caption" tone="soft">
                  {headword(entry)}
                </AppText>
              ) : null}
            </View>
            <IconButton name="speaker" label={`Pronounce ${lookup.surface}`} onPress={() => speakSwedish(lookup.surface)} color={t.blue} />
            <IconButton name="close" label="Close" onPress={onClose} color={t.inkSoft} />
          </View>

          {entry ? (
            <View style={styles.chips}>
              <Chip small label={posLabel(entry.pos)} color={t.blue} />
              {formLabel ? <Chip small label={formLabel} /> : null}
              {lookup.status === 'probable' ? <Chip small label="probable" color={t.gold} /> : null}
              {lookup.status === 'compound' ? <Chip small label="compound" color={t.gold} /> : null}
              {lookup.hit?.source === 'story' && isPrimary ? <Chip small icon="star" label="story word" color={t.green} /> : null}
            </View>
          ) : null}

          {/* Translation */}
          {translation ? (
            <Animated.View entering={FadeIn.duration(220)}>
              <AppText variant="label" tone="faint">
                English
              </AppText>
              <AppText variant="reading" style={{ fontSize: 22, lineHeight: 30, fontFamily: fonts.readMedium }}>
                {translation}
              </AppText>
            </Animated.View>
          ) : null}

          {notFound ? (
            <View style={[styles.notice, { backgroundColor: t.goldSoft }]}>
              <Icon name="info" size={16} color={t.gold} />
              <AppText variant="caption" style={{ flex: 1 }}>
                This word is not in the offline dictionary yet, so no translation is shown – the app never guesses. You can still save it and add your own note.
              </AppText>
            </View>
          ) : null}

          {lookup.explanation && isPrimary ? (
            <AppText variant="caption" tone="soft" style={{ fontStyle: 'italic' }}>
              {lookup.explanation}
            </AppText>
          ) : null}

          {lookup.compound && isPrimary ? (
            <View style={styles.chips}>
              {lookup.compound.map((p, i) => (
                <View key={i} style={[styles.part, { backgroundColor: t.surfaceAlt }]}>
                  <AppText variant="bodyStrong">{p.text}</AppText>
                  {p.hit ? (
                    <AppText variant="caption" tone="soft">
                      {p.hit.entry.en.split(',')[0]}
                    </AppText>
                  ) : (
                    <AppText variant="caption" tone="faint">
                      link
                    </AppText>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {tables.length ? <FormsGrid tables={tables} compact /> : null}

          {/* Example */}
          {entry?.example ? (
            <View style={[styles.example, { borderColor: t.accent }]}>
              <AppText variant="readingItalic">{entry.example.sv}</AppText>
              <AppText variant="caption" tone="soft">
                {entry.example.en}
              </AppText>
            </View>
          ) : request.sentence ? (
            <View style={[styles.example, { borderColor: t.line }]}>
              <AppText variant="label" tone="faint">
                In the story
              </AppText>
              <AppText variant="readingItalic" style={{ fontSize: 16, lineHeight: 24 }}>
                {highlightIn(request.sentence, lookup.surface, t.accent)}
              </AppText>
            </View>
          ) : null}

          {entry?.note ? (
            <View style={[styles.notice, { backgroundColor: t.blueSoft }]}>
              <Icon name="lightbulb" size={15} color={t.blue} />
              <AppText variant="caption" style={{ flex: 1 }}>
                {entry.note}
              </AppText>
            </View>
          ) : null}

          {alternatives.length ? (
            <View style={{ gap: 6 }}>
              <AppText variant="label" tone="faint">
                Can also be
              </AppText>
              <View style={styles.chips}>
                {alternatives.map((a, i) => (
                  <Chip key={i} label={`${a.entry.lemma} · ${posLabel(a.entry.pos).toLowerCase()} · ${a.entry.en.split(',')[0]}`} onPress={() => setHit(a)} />
                ))}
              </View>
            </View>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            {savedId ? (
              <Button
                title="In My Words"
                icon="checkCircle"
                kind="soft"
                style={{ flex: 1 }}
                onPress={() => {
                  onClose();
                  router.push({ pathname: '/word/[id]', params: { id: savedId } });
                }}
              />
            ) : (
              <Button title={notFound ? 'Save anyway' : 'Add to My Words'} icon="plus" style={{ flex: 1 }} loading={saving} onPress={save} />
            )}
          </View>
        </ScrollView>
        </View>
      </Animated.View>
    </Modal>
  );
}

/** Returns the sentence as text nodes with the word emphasised. */
function highlightIn(sentence: string, word: string, color: string) {
  const i = sentence.toLowerCase().indexOf(word.toLowerCase());
  if (i < 0) return sentence;
  return (
    <>
      {sentence.slice(0, i)}
      <AppText variant="readingItalic" style={{ color, fontFamily: fonts.readMedium, fontSize: 16 }}>
        {sentence.slice(i, i + word.length)}
      </AppText>
      {sentence.slice(i + word.length)}
    </>
  );
}

const styles = StyleSheet.create({
  card: { position: 'absolute', borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth },
  clip: { borderRadius: radius.xl, overflow: 'hidden' },
  scroll: { flexGrow: 0 },
  arrow: { position: 'absolute', width: 18, height: 18, transform: [{ rotate: '45deg' }], borderWidth: StyleSheet.hairlineWidth },
  arrowTop: { top: -9, borderRightWidth: 0, borderBottomWidth: 0 },
  arrowBottom: { bottom: -9, borderLeftWidth: 0, borderTopWidth: 0 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  notice: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md, alignItems: 'flex-start' },
  example: { borderLeftWidth: 3, paddingLeft: space.md, gap: 2 },
  part: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, alignItems: 'center' },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
});
