import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, useHaptics } from '@/components/ui';
import { useContent } from '@/content/ContentProvider';
import { flattenPages } from '@/content/story';
import { commitImport, type ImportResult, pickPackage, preparePackage } from '@/features/import/importer';
import type { ValidationIssue } from '@/features/import/validate';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, radius, space } from '@/theme/tokens';

export default function ImportScreen() {
  const t = useTheme();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const { stories, reload } = useContent();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  const choose = async () => {
    setDoneId(null);
    const picked = await pickPackage();
    if (!picked) return;
    setBusy(true);
    try {
      const bundled = new Set(stories.filter((s) => s.source === 'bundled').map((s) => s.manifest.id));
      const r = await preparePackage(db, picked.uri, picked.name, bundled);
      setResult(r);
      if (r.status === 'invalid') haptics.error();
      else haptics.success();
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!result || (result.status !== 'ready' && result.status !== 'conflict')) return;
    setBusy(true);
    try {
      await commitImport(db, result.pkg, result.files, result.fileName);
      await reload();
      haptics.success();
      setDoneId(result.pkg.manifest.id);
      setResult(null);
    } catch (e) {
      setResult({ status: 'invalid', fileName: result.fileName, issues: [{ level: 'error', where: 'import', message: (e as Error).message }] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen back="close" kicker="Importera" title="Add a story" subtitle="Import a story package from the Files app – it works offline once imported.">
      {doneId ? (
        <Animated.View entering={FadeIn}>
          <Card tint={t.successSoft} style={{ gap: space.md, borderWidth: 0 }}>
            <View style={styles.row}>
              <Icon name="checkCircle" size={26} color={t.success} />
              <AppText variant="heading" style={{ color: t.success }}>
                Added to your library
              </AppText>
            </View>
            <Button title="Open the book" icon="book" onPress={() => router.replace({ pathname: '/story/[id]', params: { id: doneId } })} />
          </Card>
        </Animated.View>
      ) : null}

      {result?.status === 'ready' || result?.status === 'conflict' ? (
        <Animated.View entering={FadeIn}>
          <Card style={{ gap: space.md }}>
            <AppText variant="label" tone="accent">
              Preview
            </AppText>
            <AppText variant="title">{result.pkg.manifest.title.sv}</AppText>
            <AppText tone="soft">{result.pkg.manifest.title.en}</AppText>
            <View style={styles.chips}>
              <Chip label={result.pkg.manifest.level.cefr} />
              <Chip label={`${flattenPages(result.pkg.manifest).length} pages`} />
              <Chip label={`${result.pkg.quiz.length} quiz questions`} />
              <Chip label={`${result.pkg.vocabulary.length} words`} />
              <Chip label={`${result.pkg.assets.length} images`} />
            </View>
            {result.status === 'conflict' ? (
              <View style={[styles.notice, { backgroundColor: t.goldSoft }]}>
                <Icon name="warning" size={16} color={t.gold} />
                <AppText variant="caption" style={{ flex: 1 }}>
                  This story is already in your library (version {result.existingVersion}). Importing replaces it with version {result.pkg.manifest.version}. Your reading progress and saved words are kept.
                </AppText>
              </View>
            ) : null}
            <Issues issues={result.issues} />
            <Button title={result.status === 'conflict' ? 'Replace story' : 'Add to library'} icon="download" loading={busy} onPress={commit} />
            <Button title="Cancel" kind="ghost" onPress={() => setResult(null)} />
          </Card>
        </Animated.View>
      ) : null}

      {result?.status === 'invalid' ? (
        <Animated.View entering={FadeIn}>
          <Card tint={t.errorSoft} style={{ gap: space.md, borderWidth: 0 }}>
            <View style={styles.row}>
              <Icon name="warning" size={22} color={t.error} />
              <AppText variant="heading" style={{ color: t.error, flex: 1 }}>
                This package can’t be imported
              </AppText>
            </View>
            <AppText variant="caption" tone="soft">
              {result.fileName}
            </AppText>
            <Issues issues={result.issues} />
          </Card>
        </Animated.View>
      ) : null}

      <Button title={result ? 'Choose another file' : 'Choose a file'} icon="import" kind={result ? 'secondary' : 'primary'} loading={busy && !result} onPress={choose} />

      <Card style={{ gap: space.md }}>
        <AppText variant="subheading">What is a story package?</AppText>
        <AppText tone="soft">A .zip file with this layout (or one .json file with everything inline):</AppText>
        <View style={[styles.code, { backgroundColor: t.surfaceAlt }]}>
          <AppText style={[styles.mono, { color: t.ink }]}>
            {'my-story.zip\n├─ story.json\n├─ cover.png\n├─ images/\n│   ├─ page-01.png\n│   └─ …\n├─ vocabulary.json\n├─ quiz.json\n└─ exercises/\n    └─ grammar.json'}
          </AppText>
        </View>
        <AppText variant="caption" tone="soft">
          Ask Claude to “write a new Saga story package following docs/STORY_FORMAT.md”, save the zip to Files, and import it here. Images can be PNG, JPG, WebP or SVG. The package is checked before anything is added.
        </AppText>
      </Card>
    </Screen>
  );
}

function Issues({ issues }: { issues: ValidationIssue[] }) {
  const t = useTheme();
  if (!issues.length) return null;
  return (
    <View style={{ gap: space.sm }}>
      {issues.slice(0, 30).map((i, k) => (
        <View key={k} style={styles.issue}>
          <Icon name={i.level === 'error' ? 'xCircle' : 'warning'} size={15} color={i.level === 'error' ? t.error : t.gold} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <AppText variant="caption" style={{ fontFamily: fonts.uiBold }}>
              {i.where}
            </AppText>
            <AppText variant="caption" tone="soft">
              {i.message}
            </AppText>
          </View>
        </View>
      ))}
      {issues.length > 30 ? (
        <AppText variant="caption" tone="faint">
          … and {issues.length - 30} more.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  notice: { flexDirection: 'row', gap: space.sm, padding: space.md, borderRadius: radius.md },
  issue: { flexDirection: 'row', gap: space.sm },
  code: { borderRadius: radius.md, padding: space.md },
  mono: { fontFamily: 'Menlo', fontSize: 13, lineHeight: 19 },
});
