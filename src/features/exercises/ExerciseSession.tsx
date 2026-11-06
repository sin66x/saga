/**
 * Runs a list of exercises one by one with immediate feedback and an explanation
 * after every answer, then shows a summary with the mistakes to review.
 * Used by grammar topics, story quizzes, the knowledge section and vocabulary practice.
 */
import { router } from 'expo-router';
import { type ReactNode, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, type ScrollViewInstance, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Button, IconButton, ProgressBar, ProgressRing } from '@/components/ui';
import type { Exercise } from '@/content/types';
import { useTheme } from '@/theme/ThemeContext';
import { cardShadow, radius, space } from '@/theme/tokens';
import { ExerciseView } from './ExerciseViews';

export interface SessionItem {
  key: string;
  exercise: Exercise;
  /** Optional label shown above the exercise (e.g. "Historia" or a story title). */
  tag?: string;
}

export interface SessionResult {
  item: SessionItem;
  correct: boolean;
}

interface Props {
  title: string;
  items: SessionItem[];
  onAnswer?: (item: SessionItem, correct: boolean) => void | Promise<void>;
  onFinish?: (results: SessionResult[]) => void | Promise<void>;
  /** Extra content in the feedback panel (e.g. the Swedish source sentence + page link). */
  renderFeedbackExtra?: (item: SessionItem, correct: boolean) => ReactNode;
  finishLabel?: string;
}

export function ExerciseSession({ title, items: initialItems, onAnswer, onFinish, renderFeedbackExtra, finishLabel = 'Done' }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<{ correct: boolean; note?: string } | null>(null);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const item = items[index];

  const handleAnswer = (correct: boolean, note?: string) => {
    if (answer) return;
    setAnswer({ correct, note });
    setResults((r) => [...r, { item, correct }]);
    void onAnswer?.(item, correct);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
  };

  const next = () => {
    if (index + 1 < items.length) {
      setIndex(index + 1);
      setAnswer(null);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } else {
      setFinished(true);
      // Only the first round counts as an attempt (retrying mistakes is extra practice).
      if (round === 0) void onFinish?.(results);
    }
  };

  const retryMistakes = () => {
    const wrong = results.filter((r) => !r.correct).map((r) => ({ ...r.item, key: `${r.item.key}#${round + 1}` }));
    setItems(wrong);
    setIndex(0);
    setAnswer(null);
    setResults([]);
    setFinished(false);
    setRound(round + 1);
  };

  if (!items.length) {
    return (
      <View style={[styles.center, { backgroundColor: t.background }]}>
        <AppText variant="heading">Nothing to practise yet</AppText>
        <Button title="Back" onPress={() => router.back()} />
      </View>
    );
  }

  if (finished) {
    const score = results.filter((r) => r.correct).length;
    const ratio = score / Math.max(1, results.length);
    const mistakes = results.filter((r) => !r.correct);
    const message = ratio === 1 ? 'Perfekt! Everything right.' : ratio >= 0.8 ? 'Mycket bra! Very good.' : ratio >= 0.5 ? 'Bra jobbat! Keep going.' : 'Bra försök – practice makes perfect.';
    return (
      <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={[styles.summary, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxxl }]}>
        <Animated.View entering={FadeInUp.duration(400)} style={{ alignItems: 'center', gap: space.md }}>
          <ProgressRing value={ratio} size={140} stroke={12} color={ratio >= 0.8 ? t.success : ratio >= 0.5 ? t.gold : t.accent}>
            <AppText variant="hero">
              {score}/{results.length}
            </AppText>
          </ProgressRing>
          <AppText variant="title" align="center">
            {message}
          </AppText>
          <AppText tone="soft" align="center">
            {title}
          </AppText>
        </Animated.View>
        {mistakes.length ? (
          <View style={{ gap: space.md, width: '100%' }}>
            <AppText variant="heading">Review your mistakes</AppText>
            {mistakes.map((m) => (
              <View key={m.item.key} style={[styles.mistake, { backgroundColor: t.surface, borderColor: t.line }]}>
                <AppText variant="bodyStrong">{describe(m.item.exercise)}</AppText>
                <AppText variant="caption" tone="soft">
                  {m.item.exercise.explanation}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
        <View style={{ gap: space.md, width: '100%' }}>
          {mistakes.length ? <Button title={`Practise the ${mistakes.length} mistake${mistakes.length > 1 ? 's' : ''} again`} icon="repeat" onPress={retryMistakes} /> : null}
          <Button title={finishLabel} kind={mistakes.length ? 'secondary' : 'primary'} onPress={() => router.back()} />
        </View>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <IconButton name="close" label="End practice" onPress={() => router.back()} filled />
        <View style={{ flex: 1, gap: 4 }}>
          <ProgressBar value={(index + (answer ? 1 : 0)) / items.length} height={8} color={t.green} />
          <AppText variant="caption" tone="soft" numberOfLines={1}>
            {title} · {index + 1} of {items.length}
          </AppText>
        </View>
      </View>
      <ScrollView ref={scrollRef} contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 140 }]} keyboardShouldPersistTaps="handled">
        <Animated.View key={item.key} entering={FadeInDown.duration(260)} style={[styles.card, { backgroundColor: t.paper, borderColor: t.line }, cardShadow(t)]}>
          {item.tag ? (
            <AppText variant="label" tone="accent">
              {item.tag}
            </AppText>
          ) : null}
          <ExerciseView exercise={item.exercise} answered={!!answer} onAnswer={handleAnswer} />
        </Animated.View>

        {answer ? (
          <Animated.View entering={FadeInUp.duration(260)} style={[styles.feedback, { backgroundColor: answer.correct ? t.successSoft : t.errorSoft }]}>
            <View style={styles.feedbackHead}>
              <Icon name={answer.correct ? 'checkCircle' : 'xCircle'} size={26} color={answer.correct ? t.success : t.error} />
              <AppText variant="heading" style={{ color: answer.correct ? t.success : t.error }}>
                {answer.correct ? 'Rätt!' : 'Inte riktigt'}
              </AppText>
            </View>
            {answer.note ? <AppText style={{ fontFamily: undefined }}>{answer.note}</AppText> : null}
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Icon name="lightbulb" size={17} color={t.gold} style={{ marginTop: 3 }} />
              <AppText style={{ flex: 1 }}>{item.exercise.explanation}</AppText>
            </View>
            {renderFeedbackExtra?.(item, answer.correct)}
          </Animated.View>
        ) : null}
      </ScrollView>
      {answer ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md, backgroundColor: t.background, borderColor: t.line }]}>
          <Button title={index + 1 < items.length ? 'Continue' : 'See results'} icon="arrowRight" onPress={next} />
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

/** Short description of an exercise for the mistakes list. */
function describe(e: Exercise): string {
  switch (e.type) {
    case 'choice':
      return e.sentence ? `${e.sentence.replace('___', e.options[e.answer])}` : `${e.prompt} → ${e.options[e.answer]}`;
    case 'fill':
      return e.sentence.replace('___', e.answers[0]);
    case 'order':
      return e.words.join(' ') + (e.end ?? '');
    case 'match':
      return e.pairs.map((p) => `${p[0]} = ${p[1]}`).join(' · ');
    case 'correct':
      return e.options[e.answer];
    case 'truefalse':
      return `${e.statement} → ${e.answer ? 'Sant' : 'Falskt'}`;
    case 'identify':
      return `${e.prompt} → ${e.target}`;
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.sm },
  body: { padding: space.lg, gap: space.lg, maxWidth: 680, width: '100%', alignSelf: 'center' },
  card: { borderRadius: radius.xl, padding: space.xl, gap: space.md, borderWidth: StyleSheet.hairlineWidth },
  feedback: { borderRadius: radius.xl, padding: space.xl, gap: space.md },
  feedbackHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: space.lg, paddingTop: space.md, borderTopWidth: StyleSheet.hairlineWidth },
  summary: { alignItems: 'center', gap: space.xxl, paddingHorizontal: space.xl, maxWidth: 680, width: '100%', alignSelf: 'center' },
  mistake: { padding: space.lg, borderRadius: radius.lg, gap: 4, borderWidth: StyleSheet.hairlineWidth },
});
