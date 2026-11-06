/**
 * One illustrated story page. Layouts vary by page (hero, full-bleed, inset,
 * portrait vignette, map, timeline, text-only) like a children's book.
 */
import { memo, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Illustration } from '@/components/Illustration';
import { Touchable } from '@/components/ui';
import type { FlatPage, Story } from '@/content/types';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, readerSizes, type ReaderSize, space } from '@/theme/tokens';
import { InteractiveText, type WordPress } from './InteractiveText';

export interface Selection {
  pageId: string;
  block: string;
  token: number;
}

interface Props {
  story: Story;
  page: FlatPage;
  width: number;
  height: number;
  size: ReaderSize;
  englishHelp: boolean;
  selection: Selection | null;
  /** Block currently being read aloud (for the gentle highlight). */
  speakingBlock?: string | null;
  onWord: (w: WordPress, block: string) => void;
  topInset: number;
  bottomInset: number;
}

/** Fact-box look per kind (fact = history, tip = good to know, fiction = story). */
const FACT_STYLE = {
  fact: { bg: 'blueSoft', color: 'blue', icon: 'info', label: 'Fakta · Historical fact' },
  tip: { bg: 'greenSoft', color: 'green', icon: 'lightbulb', label: 'Tips · Good to know' },
  fiction: { bg: 'plumSoft', color: 'plum', icon: 'book', label: 'Berättelse · Fiction' },
} as const;

export const PageView = memo(function PageView({ story, page, width, height, size, englishHelp, selection, speakingBlock, onWord, topInset, bottomInset }: Props) {
  const t = useTheme();
  const [showEnglish, setShowEnglish] = useState(false);
  const layout = page.layout ?? (page.image ? 'hero' : 'text');
  const fontSize = readerSizes[size];
  // Memoised so the (memoised) word renderers below don't see a new style object on every render.
  const textStyle = useMemo(() => ({ fontFamily: fonts.read, fontSize: fontSize.font, lineHeight: fontSize.line, color: t.ink }), [fontSize, t.ink]);
  const headingStyle = useMemo(() => ({ fontFamily: fonts.display, fontSize: fontSize.font + 7, lineHeight: fontSize.line + 6, color: t.ink }), [fontSize, t.ink]);
  const factTextStyle = useMemo(() => ({ fontFamily: fonts.readMedium, fontSize: fontSize.font - 2, lineHeight: fontSize.line - 4, color: t.ink }), [fontSize, t.ink]);
  const timelineTextStyle = useMemo(() => ({ fontFamily: fonts.read, fontSize: fontSize.font - 1, lineHeight: fontSize.line - 4, color: t.ink }), [fontSize, t.ink]);
  const sel = (block: string) => (selection && selection.pageId === page.id && selection.block === block ? selection.token : null);
  const image = page.image;
  const asset = image ? story.resolveAsset(image.src) : undefined;
  const chapter = story.manifest.chapters[page.chapterIndex];
  const isChapterStart = chapter.pages[0]?.id === page.id;

  const accent = story.manifest.theme?.accent ?? t.accent;
  /** A soft bar beside the block that is being read aloud. */
  const speaking = (block: string, node: React.ReactNode) => (
    <View key={block} style={[styles.speakWrap, speakingBlock === block && { borderLeftColor: accent, backgroundColor: t.surfaceAlt }]}>
      {node}
    </View>
  );

  const paragraphs = page.paragraphs.map((p, i) =>
    speaking(
      `p${i}`,
      <InteractiveText
        text={p}
        style={textStyle}
        block={`p${i}`}
        selectedToken={sel(`p${i}`)}
        highlightColor={t.highlight}
        onWordLongPress={onWord}
        accessibilityHint="Long-press a word to look it up"
      />,
    ),
  );

  const heading = page.heading ? speaking('h', (
    <InteractiveText
      text={page.heading}
      style={headingStyle}
      block="h"
      selectedToken={sel('h')}
      highlightColor={t.highlight}
      onWordLongPress={onWord}
    />
  )) : null;

  const chapterMark = isChapterStart ? (
    <View style={styles.chapterMark}>
      <View style={[styles.rule, { backgroundColor: accent }]} />
      <AppText variant="label" style={{ color: accent }}>
        Kapitel {page.chapterIndex + 1} · {chapter.title.sv}
      </AppText>
    </View>
  ) : null;

  const fact = page.factBox ? FACT_STYLE[page.factBox.kind] : null;
  const factBox = page.factBox && fact ? (
    <View style={[styles.factBox, speakingBlock === 'f' && { borderWidth: 2, borderColor: accent }, { backgroundColor: t[fact.bg] }]}>
      <View style={styles.factHead}>
        <Icon name={fact.icon} size={15} color={t[fact.color]} />
        <AppText variant="label" style={{ color: t[fact.color] }}>
          {fact.label}
        </AppText>
      </View>
      <InteractiveText
        text={page.factBox.text.sv}
        style={factTextStyle}
        block="f"
        selectedToken={sel('f')}
        highlightColor={t.highlight}
        onWordLongPress={onWord}
      />
      <AppText variant="caption" tone="soft" style={{ fontStyle: 'italic' }}>
        {page.factBox.text.en}
      </AppText>
    </View>
  ) : null;

  const timeline = page.timeline ? (
    <View style={styles.timeline}>
      {page.timeline.map((e, i) => (
        <Animated.View key={i} entering={FadeInDown.delay(i * 60).duration(300)} style={[styles.tlRow, speakingBlock === `t${i}` && { backgroundColor: t.surfaceAlt, borderRadius: 8 }]}>
          <View style={styles.tlRail}>
            <View style={[styles.tlDot, { backgroundColor: accent }]} />
            {i < page.timeline!.length - 1 ? <View style={[styles.tlLine, { backgroundColor: t.line }]} /> : null}
          </View>
          <View style={{ flex: 1, paddingBottom: space.lg }}>
            <AppText style={{ fontFamily: fonts.display, fontSize: 20, color: accent }}>{e.when}</AppText>
            <InteractiveText
              text={e.label}
              style={timelineTextStyle}
              block={`t${i}`}
              selectedToken={sel(`t${i}`)}
              highlightColor={t.highlight}
              onWordLongPress={onWord}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  ) : null;

  const kindBadge =
    page.kind === 'fiction' ? (
      <View style={[styles.kind, { backgroundColor: t.plumSoft }]}>
        <AppText variant="label" style={{ color: t.plum, fontSize: 10 }}>
          Berättelse
        </AppText>
      </View>
    ) : null;

  const english =
    englishHelp && page.summaryEn ? (
      <View style={{ gap: space.sm }}>
        <Touchable onPress={() => setShowEnglish((v) => !v)} style={[styles.helpPill, { borderColor: t.line }]} accessibilityRole="button" accessibilityLabel={showEnglish ? 'Hide English summary' : 'Show English summary'}>
          <Icon name="translate" size={14} color={t.inkSoft} />
          <AppText variant="caption" tone="soft" style={{ fontFamily: fonts.uiBold }}>
            {showEnglish ? 'Hide English' : 'English summary'}
          </AppText>
        </Touchable>
        {showEnglish ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <AppText variant="caption" tone="soft" style={{ fontSize: 15, lineHeight: 22, fontStyle: 'italic' }}>
              {page.summaryEn}
            </AppText>
          </Animated.View>
        ) : null}
      </View>
    ) : null;

  const pageNumber = (
    <AppText style={{ fontFamily: fonts.displayItalic, fontSize: 15, color: t.inkFaint, textAlign: 'center', marginTop: space.lg }}>
      — {page.number} —
    </AppText>
  );

  const textBlock = (
    <View style={styles.textBlock}>
      {chapterMark}
      {kindBadge}
      {heading}
      {timeline}
      <View style={{ gap: fontSize.line * 0.55 }}>{paragraphs}</View>
      {factBox}
      {english}
      {pageNumber}
    </View>
  );

  const contentHeight = height - topInset - bottomInset;
  let body: React.ReactNode;
  switch (layout) {
    case 'full': {
      const imgH = Math.min(contentHeight * 0.52, width / (image?.aspect ?? 1.33));
      body = (
        <>
          <View style={{ height: imgH + topInset, width }}>
            <Illustration source={asset} alt={image?.alt} aspect={width / (imgH + topInset)} style={StyleSheet.absoluteFill} />
            <Svg style={[StyleSheet.absoluteFill, { top: undefined, height: 70 }]} width={width} height={70}>
              <Defs>
                <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={t.paper} stopOpacity="0" />
                  <Stop offset="1" stopColor={t.paper} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect width={width} height={70} fill="url(#fade)" />
            </Svg>
          </View>
          <View style={{ marginTop: -space.lg }}>{textBlock}</View>
        </>
      );
      break;
    }
    case 'hero': {
      const imgH = Math.min(contentHeight * 0.44, (width - space.xl * 2) / (image?.aspect ?? 1.4));
      body = (
        <>
          <View style={{ height: topInset }} />
          <View style={[styles.plate, { height: imgH, backgroundColor: t.surfaceAlt }]}>
            <Illustration source={asset} alt={image?.alt} aspect={(width - space.xl * 2) / imgH} style={StyleSheet.absoluteFill} />
          </View>
          {textBlock}
        </>
      );
      break;
    }
    case 'inset': {
      const w = Math.min(width * 0.68, 360);
      body = (
        <>
          <View style={{ height: topInset + space.md }} />
          <View style={[styles.polaroid, { width: w + 16, backgroundColor: t.surface, transform: [{ rotate: page.number % 2 ? '-1.6deg' : '1.4deg' }] }]}>
            <Illustration source={asset} alt={image?.alt} aspect={image?.aspect ?? 1.2} style={{ borderRadius: 4 }} />
          </View>
          {textBlock}
        </>
      );
      break;
    }
    case 'portrait': {
      const d = Math.min(width * 0.62, contentHeight * 0.38, 320);
      body = (
        <>
          <View style={{ height: topInset + space.md }} />
          <View style={[styles.vignette, { width: d, height: d, borderRadius: d / 2, borderColor: t.surface, backgroundColor: t.surfaceAlt }]}>
            <Illustration source={asset} alt={image?.alt} aspect={1} style={StyleSheet.absoluteFill} />
          </View>
          {textBlock}
        </>
      );
      break;
    }
    case 'map': {
      body = (
        <>
          <View style={{ height: topInset }} />
          <View style={[styles.mapCard, { backgroundColor: t.surface, borderColor: t.line }]}>
            <Illustration source={asset} alt={image?.alt} aspect={image?.aspect ?? 1.1} fit="contain" style={{ borderRadius: radius.md }} />
            {image?.caption ? (
              <AppText variant="caption" tone="soft" align="center" style={{ fontStyle: 'italic', marginTop: space.sm }}>
                {image.caption.sv} · {image.caption.en}
              </AppText>
            ) : null}
          </View>
          {textBlock}
        </>
      );
      break;
    }
    default:
      body = (
        <>
          <View style={{ height: topInset + space.xl }} />
          {image ? (
            <View style={[styles.plate, { height: Math.min(contentHeight * 0.3, 220), backgroundColor: t.surfaceAlt }]}>
              <Illustration source={asset} alt={image.alt} style={StyleSheet.absoluteFill} />
            </View>
          ) : (
            <View style={styles.ornament}>
              <View style={[styles.rule, { backgroundColor: t.line, width: 60 }]} />
              <Icon name="leaf" size={18} color={accent} />
              <View style={[styles.rule, { backgroundColor: t.line, width: 60 }]} />
            </View>
          )}
          {textBlock}
        </>
      );
  }

  return (
    <View style={{ width, height, backgroundColor: t.paper }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomInset + space.xl, minHeight: height }}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {body}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  textBlock: { paddingHorizontal: space.xxl, paddingTop: space.xl, gap: space.lg, maxWidth: 640, width: '100%', alignSelf: 'center' },
  plate: { marginHorizontal: space.xl, borderRadius: radius.xl, overflow: 'hidden', marginTop: space.sm },
  polaroid: { alignSelf: 'center', padding: 8, paddingBottom: 18, borderRadius: 6, shadowColor: '#5A4026', shadowOpacity: 0.16, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  vignette: { alignSelf: 'center', overflow: 'hidden', borderWidth: 6 },
  mapCard: { marginHorizontal: space.lg, padding: space.sm, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  speakWrap: { borderLeftWidth: 3, borderLeftColor: 'transparent', paddingLeft: 10, marginLeft: -13, paddingVertical: 2, borderRadius: 4 },
  chapterMark: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  rule: { height: 2, width: 22, borderRadius: 1 },
  factBox: { borderRadius: radius.lg, padding: space.lg, gap: space.sm },
  factHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeline: { paddingTop: space.xs },
  tlRow: { flexDirection: 'row', gap: space.md },
  tlRail: { width: 16, alignItems: 'center' },
  tlDot: { width: 12, height: 12, borderRadius: 6, marginTop: 7 },
  tlLine: { width: 2, flex: 1, marginTop: 4 },
  kind: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  helpPill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  ornament: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
});
