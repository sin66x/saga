import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Card, Chip, ProgressBar, SectionHeader, Touchable } from '@/components/ui';
import { getTopicStats } from '@/db/repos/results';
import { getVocabCounts } from '@/db/repos/vocabulary';
import { useDbQuery } from '@/db/useDbQuery';
import { topicsByCategory } from '@/features/grammar';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function PracticeScreen() {
  const t = useTheme();
  const { data } = useDbQuery(async (db) => ({ vocab: await getVocabCounts(db), topics: await getTopicStats(db, 'grammar') }), ['vocabulary', 'results']);
  const due = data?.vocab.due ?? 0;
  const total = data?.vocab.total ?? 0;

  return (
    <Screen kicker="Öva" title="Practice" subtitle="Short, friendly sessions. A few minutes every day is enough.">
      <View style={{ gap: space.md }}>
        <BigAction
          icon="cards"
          color={t.accent}
          soft={t.accentSoft}
          title="Daily review"
          sv="Dagens repetition"
          detail={due ? `${due} word${due === 1 ? '' : 's'} ready to review` : total ? 'All caught up – nothing due right now' : 'Save words while reading to start'}
          disabled={!due}
          onPress={() => router.push('/review')}
        />
        <BigAction
          icon="practice"
          color={t.blue}
          soft={t.blueSoft}
          title="Vocabulary exercises"
          sv="Ordövningar"
          detail={total >= 3 ? 'Translate, fill in, match and find words from your stories' : 'Save at least 3 words to unlock'}
          disabled={total < 3}
          onPress={() => router.push('/vocab-practice')}
        />
        <BigAction icon="globe" color={t.gold} soft={t.goldSoft} title="Swedish knowledge" sv="Historia och kultur" detail="Questions about history and culture from finished stories" onPress={() => router.push('/knowledge')} />
      </View>

      <View style={{ gap: space.xxl }}>
        <SectionHeader title="Grammar" subtitle="Grammatik – following the SFI progression" />
        {topicsByCategory().map(({ category, topics }) => (
          <View key={category.id} style={{ gap: space.sm }}>
            <AppText variant="label" tone="accent">
              {category.titleSv} · {category.title}
            </AppText>
            {topics.map((topic) => {
              const s = data?.topics[topic.id];
              const done = s ? Math.min(1, s.mastered / topic.exercises.length) : 0;
              return (
                <Touchable
                  key={topic.id}
                  onPress={() => router.push({ pathname: '/grammar/[topic]', params: { topic: topic.id } })}
                  style={[styles.topic, { backgroundColor: t.surface, borderColor: t.line }]}
                  accessibilityLabel={`${topic.title}, level ${topic.level}`}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                      <AppText variant="bodyStrong" style={{ flexShrink: 1 }}>
                        {topic.title}
                      </AppText>
                      <Chip small label={topic.level} />
                    </View>
                    <AppText variant="caption" tone="soft" numberOfLines={1}>
                      {topic.summary}
                    </AppText>
                    {s ? <ProgressBar value={done} height={3} color={done >= 1 ? t.success : t.green} style={{ marginTop: 4 }} /> : null}
                  </View>
                  {done >= 1 ? <Icon name="checkCircle" size={20} color={t.success} /> : <Icon name="forward" size={14} color={t.inkFaint} />}
                </Touchable>
              );
            })}
          </View>
        ))}
      </View>
    </Screen>
  );
}

function BigAction({ icon, color, soft, title, sv, detail, onPress, disabled }: { icon: IconName; color: string; soft: string; title: string; sv: string; detail: string; onPress: () => void; disabled?: boolean }) {
  const t = useTheme();
  return (
    <Card tint={soft} onPress={disabled ? undefined : onPress} style={[styles.big, { opacity: disabled ? 0.6 : 1 }]} accessibilityLabel={title}>
      <View style={[styles.bigIcon, { backgroundColor: color }]}>
        <Icon name={icon} size={24} color="#FFFFFF" />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="label" style={{ color }}>
          {sv}
        </AppText>
        <AppText style={{ fontFamily: fonts.display, fontSize: 20, color: t.ink }}>{title}</AppText>
        <AppText variant="caption" tone="soft">
          {detail}
        </AppText>
      </View>
      {!disabled ? <Icon name="forward" size={15} color={t.inkFaint} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  big: { flexDirection: 'row', alignItems: 'center', gap: space.md, borderWidth: 0 },
  bigIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  topic: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
});
