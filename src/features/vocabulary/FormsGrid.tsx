import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import type { FormTable } from '@/features/dictionary/presentation';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

/** Grammatical forms as a tidy two-column table (Swedish term + value). */
export function FormsGrid({ tables, compact }: { tables: FormTable[]; compact?: boolean }) {
  const t = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: t.surfaceAlt }, compact && { padding: space.md }]}>
      {tables.map((table, ti) => (
        <View key={ti} style={{ gap: 4 }}>
          <AppText variant="label" tone="faint">
            {table.title}
          </AppText>
          {table.rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.label ? (
                <AppText variant="caption" tone="soft" style={styles.label}>
                  {row.label}
                  <AppText variant="caption" tone="faint">
                    {'  '}
                    {row.labelSv}
                  </AppText>
                </AppText>
              ) : null}
              <AppText style={{ fontFamily: fonts.readMedium, fontSize: compact ? 16 : 17, color: t.ink, flexShrink: 1 }} selectable>
                {row.value}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: radius.md, padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  label: { width: 150 },
});
