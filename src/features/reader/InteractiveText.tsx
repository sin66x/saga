/**
 * Word-level interactive text.
 *
 * The paragraph is ONE text layout (so line breaking, kerning and justification stay exactly as the browser
 * lays out normal text), with every word as a nested <Text> span carrying its own pointer handlers. Spaces and
 * punctuation are plain strings and cannot be pressed.
 *
 * Gesture: on a touch screen, press and hold a word for about half a second (any movement cancels it, so
 * swiping pages and scrolling never open it). With a mouse, a click opens it.
 */
import { memo, useMemo, useRef } from 'react';
import { type GestureResponderEvent, type StyleProp, Text, type TextStyle } from 'react-native';
import { sentenceAt, tokenize } from '@/lib/tokenizer';

export interface WordPress {
  word: string;
  tokenIndex: number;
  sentence: string;
  previousWord?: string;
  nextWord?: string;
  pageX: number;
  pageY: number;
}

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  /** Token index to highlight (the word whose popover is open). */
  selectedToken?: number | null;
  highlightColor: string;
  /** Which block of the page this text is (paragraph, heading …); handed back with the pressed word. */
  block: string;
  /** Should be a stable function: this component is memoised on it. */
  onWordLongPress: (w: WordPress, block: string) => void;
  accessibilityHint?: string;
}

const WEB_HOLD_MS = 450;
const WEB_MOVE_TOLERANCE = 10;

interface DomPointer {
  pointerType?: string;
  pageX?: number;
  pageY?: number;
  nativeEvent?: { pageX?: number; pageY?: number };
}
const pointOf = (e: DomPointer) => ({ x: e.pageX ?? e.nativeEvent?.pageX ?? 0, y: e.pageY ?? e.nativeEvent?.pageY ?? 0 });

/** Press-and-hold state for the web (one pointer at a time is enough for reading). */
interface Hold {
  timer: ReturnType<typeof setTimeout> | null;
  x: number;
  y: number;
  type: string;
}
function cancelHold(h: Hold) {
  if (h.timer) clearTimeout(h.timer);
  h.timer = null;
}

/** Stops iOS Safari from selecting the word / showing its copy menu while you press and hold. */
const NO_SELECT = { userSelect: 'none', WebkitTouchCallout: 'none' } as TextStyle;

export const InteractiveText = memo(function InteractiveText({ text, style, block, selectedToken, highlightColor, onWordLongPress, accessibilityHint }: Props) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const holdRef = useRef<Hold>({ timer: null, x: 0, y: 0, type: 'mouse' });

  const neighbours = useMemo(() => {
    // previous/next *word* for each token, used for homograph disambiguation
    const words = tokens.map((t, i) => (t.kind === 'word' ? i : -1)).filter((i) => i >= 0);
    const map = new Map<number, { prev?: string; next?: string }>();
    words.forEach((ti, k) => map.set(ti, { prev: k > 0 ? tokens[words[k - 1]].text : undefined, next: k < words.length - 1 ? tokens[words[k + 1]].text : undefined }));
    return map;
  }, [tokens]);

  const make = (i: number, word: string, pageX: number, pageY: number): WordPress => ({
    word,
    tokenIndex: i,
    sentence: sentenceAt(tokens, i),
    previousWord: neighbours.get(i)?.prev,
    nextWord: neighbours.get(i)?.next,
    pageX,
    pageY,
  });

  // The pointer handlers that do not depend on which word it is are shared by every word.
  const shared = useMemo(() => {
    const cancel = () => cancelHold(holdRef.current);
    return {
      onPointerMove: (e: DomPointer) => {
        const hold = holdRef.current;
        if (!hold.timer) return;
        const { x, y } = pointOf(e);
        if (Math.abs(x - hold.x) > WEB_MOVE_TOLERANCE || Math.abs(y - hold.y) > WEB_MOVE_TOLERANCE) cancelHold(hold);
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
      onPointerLeave: cancel,
      onContextMenu: (e: { preventDefault?: () => void }) => e.preventDefault?.(),
    };
  }, []);

  return (
    <Text style={[style, NO_SELECT]} accessibilityHint={accessibilityHint} maxFontSizeMultiplier={1.5}>
      {tokens.map((tok, i) => {
        const pressable = tok.kind === 'word' || (tok.kind === 'number' && tok.text.includes('-'));
        if (!pressable) return tok.text;
        const highlight = selectedToken === i ? { backgroundColor: highlightColor, borderRadius: 4 } : undefined;
        // Pointer events (react-native-web forwards them to the DOM element).
        const webProps = {
          ...shared,
          onPointerDown: (e: DomPointer) => {
            const hold = holdRef.current;
            cancelHold(hold);
            hold.type = e.pointerType ?? 'mouse';
            const { x, y } = pointOf(e);
            hold.x = x;
            hold.y = y;
            if (hold.type === 'mouse') return;
            hold.timer = setTimeout(() => {
              hold.timer = null;
              onWordLongPress(make(i, tok.text, hold.x, hold.y), block);
            }, WEB_HOLD_MS);
          },
          // A mouse click opens the dictionary right away (handy on a computer).
          onPress: (e: GestureResponderEvent) => {
            if (holdRef.current.type === 'mouse') onWordLongPress(make(i, tok.text, e.nativeEvent.pageX, e.nativeEvent.pageY), block);
          },
        };
        return (
          <Text key={i} {...(webProps as object)} style={highlight}>
            {tok.text}
          </Text>
        );
      })}
    </Text>
  );
});
