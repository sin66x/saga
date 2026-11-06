/**
 * Renderers for each exercise type. Each view reports the answer once through
 * `onAnswer(correct, note?)` and then shows the solution state.
 */
import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Button, Touchable, useHaptics } from '@/components/ui';
import type {
  ChoiceExercise, CorrectExercise, Exercise, FillExercise, IdentifyExercise, MatchExercise, OrderExercise, TrueFalseExercise,
} from '@/content/types';
import { speakSwedish } from '@/lib/speech';
import { tokenize } from '@/lib/tokenizer';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';
import { checkOrder, checkTyped, joinWords, nearMissMessage, seededShuffle } from './check';

export interface ExerciseViewProps<E extends Exercise = Exercise> {
  exercise: E;
  answered: boolean;
  onAnswer: (correct: boolean, note?: string) => void;
}

export function ExerciseView(props: ExerciseViewProps) {
  const { exercise } = props;
  switch (exercise.type) {
    case 'choice':
      return <ChoiceView {...(props as ExerciseViewProps<ChoiceExercise>)} />;
    case 'truefalse':
      return <TrueFalseView {...(props as ExerciseViewProps<TrueFalseExercise>)} />;
    case 'fill':
      return <FillView {...(props as ExerciseViewProps<FillExercise>)} />;
    case 'order':
      return <OrderView {...(props as ExerciseViewProps<OrderExercise>)} />;
    case 'match':
      return <MatchView {...(props as ExerciseViewProps<MatchExercise>)} />;
    case 'correct':
      return <CorrectView {...(props as ExerciseViewProps<CorrectExercise>)} />;
    case 'identify':
      return <IdentifyView {...(props as ExerciseViewProps<IdentifyExercise>)} />;
  }
}

/* ------------------------------------------------------------------ */

function Prompt({ text }: { text: string }) {
  return (
    <AppText variant="subheading" tone="soft" style={{ fontSize: 16 }}>
      {text}
    </AppText>
  );
}

/** A Swedish sentence; "___" is drawn as a gap (or filled with `fill`). */
export function SwedishSentence({ text, fill, fillColor, size = 22 }: { text: string; fill?: string; fillColor?: string; size?: number }) {
  const t = useTheme();
  const parts = text.split('___');
  return (
    <View style={styles.sentenceRow}>
      <AppText style={{ fontFamily: fonts.read, fontSize: size, lineHeight: size * 1.45, color: t.ink, flex: 1 }}>
        {parts.map((p, i) => (
          <AppText key={i} style={{ fontFamily: fonts.read, fontSize: size, color: t.ink }}>
            {p}
            {i < parts.length - 1 ? (
              <AppText style={{ fontFamily: fonts.readMedium, fontSize: size, color: fill ? (fillColor ?? t.accent) : t.inkFaint, textDecorationLine: fill ? 'none' : 'underline' }}>
                {fill ?? '     '}
              </AppText>
            ) : null}
          </AppText>
        ))}
      </AppText>
      <Touchable onPress={() => speakSwedish(text.replace(/___/g, fill ?? '…'))} hitSlop={10} accessibilityLabel="Listen" accessibilityRole="button">
        <Icon name="speaker" size={20} color={t.blue} />
      </Touchable>
    </View>
  );
}

type OptionState = 'idle' | 'correct' | 'wrong' | 'muted';

function OptionButton({ label, state, onPress, swedish, disabled }: { label: string; state: OptionState; onPress: () => void; swedish?: boolean; disabled?: boolean }) {
  const t = useTheme();
  const bg = { idle: t.surface, correct: t.successSoft, wrong: t.errorSoft, muted: t.surface }[state];
  const border = { idle: t.line, correct: t.success, wrong: t.error, muted: t.line }[state];
  return (
    <Touchable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: state === 'correct' || state === 'wrong' }}
      style={[styles.option, { backgroundColor: bg, borderColor: border, opacity: state === 'muted' ? 0.55 : 1 }]}>
      <AppText style={{ flex: 1, fontFamily: swedish ? fonts.read : fonts.uiSemi, fontSize: swedish ? 18 : 16.5, color: t.ink }}>{label}</AppText>
      {state === 'correct' ? <Icon name="checkCircle" size={22} color={t.success} /> : null}
      {state === 'wrong' ? <Icon name="xCircle" size={22} color={t.error} /> : null}
    </Touchable>
  );
}

const looksSwedish = (s: string) => /[åäö]/i.test(s) || /^(en|ett|att|jag|de|det|den|han|hon|vi|man)\b/i.test(s);

/* ------------------------------------------------------------------ */

function ChoiceView({ exercise, answered, onAnswer }: ExerciseViewProps<ChoiceExercise>) {
  const [chosen, setChosen] = useState<number | null>(null);
  const haptics = useHaptics();
  const swedishOptions = exercise.options.some(looksSwedish);
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      {exercise.sentence ? <SwedishSentence text={exercise.sentence} fill={answered ? exercise.options[exercise.answer] : undefined} /> : null}
      <View style={styles.options}>
        {exercise.options.map((o, i) => {
          const state: OptionState = !answered ? 'idle' : i === exercise.answer ? 'correct' : i === chosen ? 'wrong' : 'muted';
          return (
            <OptionButton
              key={i}
              label={o}
              swedish={swedishOptions}
              state={state}
              disabled={answered}
              onPress={() => {
                setChosen(i);
                const ok = i === exercise.answer;
                if (ok) haptics.success();
                else haptics.error();
                onAnswer(ok, ok ? undefined : exercise.wrong?.[String(i)]);
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TrueFalseView({ exercise, answered, onAnswer }: ExerciseViewProps<TrueFalseExercise>) {
  const [chosen, setChosen] = useState<boolean | null>(null);
  const haptics = useHaptics();
  const t = useTheme();
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      <View style={[styles.statement, { backgroundColor: t.surfaceAlt }]}>
        <SwedishSentence text={exercise.statement} />
      </View>
      <View style={styles.row}>
        {[true, false].map((v) => {
          const state: OptionState = !answered ? 'idle' : v === exercise.answer ? 'correct' : v === chosen ? 'wrong' : 'muted';
          return (
            <View key={String(v)} style={{ flex: 1 }}>
              <OptionButton
                label={v ? 'Sant · True' : 'Falskt · False'}
                state={state}
                disabled={answered}
                onPress={() => {
                  setChosen(v);
                  const ok = v === exercise.answer;
                  if (ok) haptics.success();
                  else haptics.error();
                  onAnswer(ok);
                }}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SwedishKeys({ onKey }: { onKey: (k: string) => void }) {
  const t = useTheme();
  return (
    <View style={styles.keys}>
      {['å', 'ä', 'ö', 'Å', 'Ä', 'Ö'].map((k) => (
        <Touchable key={k} onPress={() => onKey(k)} style={[styles.key, { backgroundColor: t.surfaceAlt }]} accessibilityLabel={`Type ${k}`}>
          <AppText style={{ fontFamily: fonts.uiBold, fontSize: 18, color: t.ink }}>{k}</AppText>
        </Touchable>
      ))}
    </View>
  );
}

function FillView({ exercise, answered, onAnswer }: ExerciseViewProps<FillExercise>) {
  const t = useTheme();
  const haptics = useHaptics();
  const [value, setValue] = useState('');
  const [result, setResult] = useState<ReturnType<typeof checkTyped> | null>(null);
  const submit = () => {
    if (!value.trim()) return;
    const r = checkTyped(value, exercise.answers);
    setResult(r);
    if (r.correct) haptics.success();
    else haptics.error();
    onAnswer(r.correct, r.correct ? undefined : [nearMissMessage(r.nearMiss), `Correct answer: ${r.expected}`].filter(Boolean).join(' '));
  };
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      <SwedishSentence text={exercise.sentence} fill={answered ? exercise.answers[0] : value || undefined} fillColor={answered ? (result?.correct ? t.success : t.accent) : t.blue} />
      {exercise.translation ? (
        <AppText variant="caption" tone="soft" style={{ fontStyle: 'italic' }}>
          {exercise.translation}
        </AppText>
      ) : null}
      {!answered ? (
        <>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Type your answer"
            placeholderTextColor={t.inkFaint}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="done"
            onSubmitEditing={submit}
            style={[styles.input, { backgroundColor: t.surface, borderColor: t.line, color: t.ink }]}
            accessibilityLabel="Answer"
          />
          <SwedishKeys onKey={(k) => setValue((v) => v + k)} />
          <Button title="Check" onPress={submit} disabled={!value.trim()} />
        </>
      ) : result && !result.correct ? (
        <AppText tone="error" style={{ fontFamily: fonts.uiSemi }}>
          You wrote: {value}
        </AppText>
      ) : null}
    </View>
  );
}

function OrderView({ exercise, answered, onAnswer }: ExerciseViewProps<OrderExercise>) {
  const t = useTheme();
  const haptics = useHaptics();
  const bank = useMemo(() => seededShuffle(exercise.words.map((w, i) => ({ w, i })), exercise.id + exercise.words.join()), [exercise]);
  const [picked, setPicked] = useState<number[]>([]);
  const [ok, setOk] = useState<boolean | null>(null);
  const placed = picked.map((i) => exercise.words[i]);
  const check = () => {
    const correct = checkOrder(placed, exercise);
    setOk(correct);
    if (correct) haptics.success();
    else haptics.error();
    onAnswer(correct, correct ? undefined : `Correct order: ${joinWords(exercise.words, exercise.end)}`);
  };
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      {exercise.translation ? (
        <AppText variant="caption" tone="soft" style={{ fontStyle: 'italic' }}>
          “{exercise.translation}”
        </AppText>
      ) : null}
      <View style={[styles.answerLine, { borderColor: ok === null ? t.line : ok ? t.success : t.error, backgroundColor: t.surfaceAlt }]}>
        {picked.length === 0 ? (
          <AppText tone="faint">Tap the words in order…</AppText>
        ) : (
          picked.map((i, k) => (
            <Touchable key={`${i}-${k}`} disabled={answered} onPress={() => setPicked((p) => p.filter((_, idx) => idx !== k))} style={[styles.tile, { backgroundColor: t.surface, borderColor: t.line }]}>
              <AppText style={styles.tileText}>{k === 0 ? cap(exercise.words[i]) : exercise.words[i]}</AppText>
            </Touchable>
          ))
        )}
        {picked.length === exercise.words.length && exercise.end ? <AppText style={styles.tileText}>{exercise.end}</AppText> : null}
      </View>
      <View style={styles.bank}>
        {bank.map(({ w, i }) => {
          const used = picked.includes(i);
          return (
            <Touchable
              key={i}
              disabled={used || answered}
              onPress={() => {
                haptics.selection();
                setPicked((p) => [...p, i]);
              }}
              style={[styles.tile, { backgroundColor: used ? 'transparent' : t.surface, borderColor: used ? t.line : t.inkFaint, borderStyle: used ? 'dashed' : 'solid' }]}>
              <AppText style={[styles.tileText, { opacity: used ? 0.2 : 1 }]}>{w}</AppText>
            </Touchable>
          );
        })}
      </View>
      {!answered ? <Button title="Check" onPress={check} disabled={picked.length !== exercise.words.length} /> : null}
    </View>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function MatchView({ exercise, answered, onAnswer }: ExerciseViewProps<MatchExercise>) {
  const t = useTheme();
  const haptics = useHaptics();
  const rights = useMemo(() => seededShuffle(exercise.pairs.map((p, i) => ({ text: p[1], i })), exercise.id), [exercise]);
  const [left, setLeft] = useState<number | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const pick = (rightIndex: number) => {
    if (left === null) return;
    if (rightIndex === left) {
      haptics.selection();
      const next = new Set(done).add(left);
      setDone(next);
      setLeft(null);
      if (next.size === exercise.pairs.length) {
        const correct = mistakes === 0;
        if (correct) haptics.success();
        else haptics.error();
        onAnswer(correct, correct ? undefined : `${mistakes} mismatch${mistakes === 1 ? '' : 'es'} before finding all pairs.`);
      }
    } else {
      haptics.error();
      setMistakes((m) => m + 1);
      setWrongFlash(rightIndex);
      setTimeout(() => setWrongFlash(null), 500);
    }
  };

  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      <View style={styles.row}>
        <View style={[styles.col]}>
          {exercise.pairs.map((p, i) => {
            const matched = done.has(i);
            const active = left === i;
            return (
              <Touchable
                key={i}
                disabled={matched || answered}
                onPress={() => setLeft(i)}
                style={[styles.matchItem, { backgroundColor: matched ? t.successSoft : active ? t.blueSoft : t.surface, borderColor: matched ? t.success : active ? t.blue : t.line }]}>
                <AppText style={{ fontFamily: fonts.read, fontSize: 16.5, color: t.ink }}>{p[0]}</AppText>
              </Touchable>
            );
          })}
        </View>
        <View style={styles.col}>
          {rights.map(({ text, i }) => {
            const matched = done.has(i);
            return (
              <Touchable
                key={i}
                disabled={matched || answered}
                onPress={() => pick(i)}
                style={[styles.matchItem, { backgroundColor: matched ? t.successSoft : wrongFlash === i ? t.errorSoft : t.surface, borderColor: matched ? t.success : wrongFlash === i ? t.error : t.line }]}>
                <AppText style={{ fontFamily: fonts.uiSemi, fontSize: 15.5, color: t.ink }}>{text}</AppText>
              </Touchable>
            );
          })}
        </View>
      </View>
      {!answered ? (
        <AppText variant="caption" tone="faint" align="center">
          Tap a word on the left, then its match on the right.
        </AppText>
      ) : null}
    </View>
  );
}

function CorrectView({ exercise, answered, onAnswer }: ExerciseViewProps<CorrectExercise>) {
  const t = useTheme();
  const [chosen, setChosen] = useState<number | null>(null);
  const haptics = useHaptics();
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      <View style={[styles.statement, { backgroundColor: t.errorSoft }]}>
        <AppText variant="label" tone="error">
          Find the mistake
        </AppText>
        <AppText style={{ fontFamily: fonts.read, fontSize: 19, lineHeight: 27, color: t.ink }}>{exercise.incorrect}</AppText>
      </View>
      <View style={styles.options}>
        {exercise.options.map((o, i) => (
          <OptionButton
            key={i}
            label={o}
            swedish
            disabled={answered}
            state={!answered ? 'idle' : i === exercise.answer ? 'correct' : i === chosen ? 'wrong' : 'muted'}
            onPress={() => {
              setChosen(i);
              const ok = i === exercise.answer;
              if (ok) haptics.success();
              else haptics.error();
              onAnswer(ok, ok ? undefined : exercise.wrong?.[String(i)]);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function IdentifyView({ exercise, answered, onAnswer }: ExerciseViewProps<IdentifyExercise>) {
  const t = useTheme();
  const haptics = useHaptics();
  const tokens = useMemo(() => tokenize(exercise.sentence), [exercise.sentence]);
  const [chosen, setChosen] = useState<number | null>(null);
  const targetIndex = tokens.findIndex((tok) => tok.kind === 'word' && tok.text.toLowerCase() === exercise.target.toLowerCase());
  return (
    <View style={styles.gap}>
      <Prompt text={exercise.prompt} />
      <View style={styles.identify}>
        {tokens.map((tok, i) => {
          if (tok.kind === 'space') return null;
          if (tok.kind !== 'word') return <AppText key={i} style={{ fontFamily: fonts.read, fontSize: 20, color: t.ink }}>{tok.text}</AppText>;
          const state = !answered ? 'idle' : i === targetIndex ? 'correct' : i === chosen ? 'wrong' : 'idle';
          return (
            <Touchable
              key={i}
              disabled={answered}
              onPress={() => {
                setChosen(i);
                const ok = i === targetIndex;
                if (ok) haptics.success();
                else haptics.error();
                onAnswer(ok, ok ? undefined : `The word was “${exercise.target}”.`);
              }}
              style={[
                styles.identifyWord,
                { backgroundColor: state === 'correct' ? t.successSoft : state === 'wrong' ? t.errorSoft : t.surface, borderColor: state === 'correct' ? t.success : state === 'wrong' ? t.error : t.line },
              ]}>
              <AppText style={{ fontFamily: fonts.read, fontSize: 19, color: t.ink }}>{tok.text}</AppText>
            </Touchable>
          );
        })}
      </View>
      {exercise.translation && answered ? (
        <Animated.View entering={FadeIn}>
          <AppText variant="caption" tone="soft" style={{ fontStyle: 'italic' }}>
            {exercise.translation}
          </AppText>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { gap: space.lg },
  sentenceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  options: { gap: space.sm },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.md, borderRadius: radius.lg, borderWidth: 1.5 },
  row: { flexDirection: 'row', gap: space.sm },
  statement: { padding: space.lg, borderRadius: radius.lg, gap: space.xs },
  input: { height: 54, borderRadius: radius.lg, borderWidth: 1.5, paddingHorizontal: space.lg, fontSize: 19, fontFamily: fonts.read },
  keys: { flexDirection: 'row', gap: space.sm },
  key: { flex: 1, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  answerLine: { minHeight: 70, borderWidth: 1.5, borderRadius: radius.lg, padding: space.md, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, alignItems: 'center' },
  bank: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center' },
  tile: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.md, borderWidth: 1.5 },
  tileText: { fontFamily: fonts.read, fontSize: 18 },
  col: { flex: 1, gap: space.sm },
  matchItem: { minHeight: 52, justifyContent: 'center', paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, borderWidth: 1.5 },
  identify: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  identifyWord: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, borderWidth: 1 },
});
