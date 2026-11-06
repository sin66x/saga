import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Touchable } from '@/components/ui';
import type { QuizQuestion, Story } from '@/content/types';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, space } from '@/theme/tokens';

export const CATEGORY_LABELS: Record<QuizQuestion['category'], string> = {
  comprehension: 'Läsförståelse · Reading',
  history: 'Historia · History',
  culture: 'Kultur · Culture',
  vocabulary: 'Ordförråd · Vocabulary',
};

/** The Swedish source sentence and a link back to the story page. */
export function QuizFeedback({ question, story }: { question: QuizQuestion; story: Story }) {
  const t = useTheme();
  const page = question.pageId ? story.pages.find((p) => p.id === question.pageId) : undefined;
  return (
    <View style={{ gap: space.sm }}>
      {question.swedish ? (
        <View style={[styles.quote, { borderColor: t.accent }]}>
          <AppText style={{ fontFamily: fonts.readItalic, fontSize: 16.5, lineHeight: 24, color: t.ink }}>“{question.swedish}”</AppText>
        </View>
      ) : null}
      {page ? (
        <Touchable
          onPress={() => router.push({ pathname: '/read/[id]', params: { id: story.manifest.id, page: String(page.index) } })}
          style={styles.link}
          accessibilityRole="link"
          accessibilityLabel={`Read page ${page.number} again`}>
          <Icon name="book" size={15} color={t.accent} />
          <AppText variant="caption" style={{ color: t.accent, fontFamily: fonts.uiBold }}>
            Read it again: {story.manifest.title.sv}, page {page.number}
          </AppText>
        </Touchable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  quote: { borderLeftWidth: 3, paddingLeft: space.md },
  link: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
});
