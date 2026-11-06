import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Touchable } from '@/components/ui';
import { speakSwedish } from '@/lib/speech';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';
import type { LessonBlock } from './types';

/** Renders **bold** and *italic* inline markup. */
export function Rich({ text, style }: { text: string; style?: object }) {
  const t = useTheme();
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <AppText style={[{ fontSize: 16.5, lineHeight: 25 }, style]}>
      {parts.map((part, i) =>
        part.startsWith('**') ? (
          <AppText key={i} style={{ fontFamily: fonts.uiHeavy, color: t.ink, fontSize: 16.5 }}>
            {part.slice(2, -2)}
          </AppText>
        ) : part.startsWith('*') ? (
          <AppText key={i} style={{ fontFamily: fonts.readItalic, color: t.ink, fontSize: 16.5 }}>
            {part.slice(1, -1)}
          </AppText>
        ) : (
          part
        ),
      )}
    </AppText>
  );
}

export function LessonView({ blocks }: { blocks: LessonBlock[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.xl }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'text':
            return <Rich key={i} text={b.text} />;
          case 'examples':
            return (
              <View key={i} style={[styles.examples, { backgroundColor: t.surface, borderColor: t.line }]}>
                {b.items.map((e, k) => (
                  <Touchable key={k} onPress={() => speakSwedish(e.sv.split('→').pop()!.trim())} style={styles.example} accessibilityLabel={`${e.sv}. ${e.en}. Tap to listen.`}>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontFamily: fonts.read, fontSize: 18, lineHeight: 26, color: t.ink }}>{e.sv}</AppText>
                      <AppText variant="caption" tone="soft">
                        {e.en}
                      </AppText>
                    </View>
                    <Icon name="speaker" size={16} color={t.blue} />
                  </Touchable>
                ))}
              </View>
            );
          case 'table': {
            // Column widths follow the longest cell in each column.
            const weights = b.headers.map((h, c) => Math.min(14, Math.max(4, h.length, ...b.rows.map((row) => row[c]?.length ?? 0))));
            return (
              <View key={i} style={{ gap: space.sm }}>
                {b.caption ? (
                  <AppText variant="label" tone="faint">
                    {b.caption}
                  </AppText>
                ) : null}
                <View style={[styles.table, { borderColor: t.line }]}>
                  <View style={[styles.tr, { backgroundColor: t.surfaceAlt }]}>
                    {b.headers.map((h, k) => (
                      <AppText key={k} style={[styles.td, { flex: weights[k], fontFamily: fonts.uiHeavy, fontSize: 12.5, color: t.inkSoft }]}>
                        {h}
                      </AppText>
                    ))}
                  </View>
                  {b.rows.map((row, r) => (
                    <View key={r} style={[styles.tr, { borderTopColor: t.line, borderTopWidth: StyleSheet.hairlineWidth, backgroundColor: t.surface }]}>
                      {row.map((cell, k) => (
                        <AppText key={k} style={[styles.td, { flex: weights[k], fontFamily: k === 0 ? fonts.readMedium : fonts.read, fontSize: 14.5, color: t.ink }]}>
                          {cell}
                        </AppText>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            );
          }
          case 'tip':
            return (
              <View key={i} style={[styles.tip, { backgroundColor: t.goldSoft }]}>
                <Icon name="lightbulb" size={18} color={t.gold} />
                <Rich text={b.text} style={{ flex: 1, fontSize: 15, lineHeight: 22 }} />
              </View>
            );
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  examples: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingVertical: space.xs },
  example: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.sm },
  table: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tr: { flexDirection: 'row' },
  td: { flex: 1, paddingHorizontal: space.sm, paddingVertical: space.sm },
  tip: { flexDirection: 'row', gap: space.sm, padding: space.lg, borderRadius: radius.lg },
});
