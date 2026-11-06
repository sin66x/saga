import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, Divider } from '@/components/ui';
import { createBackupJson, resetAllProgress, restoreBackup } from '@/db/backup';
import { useSettings } from '@/features/settings/SettingsProvider';
import { showAlert } from '@/lib/dialog';
import { shareFile } from '@/lib/files';
import { isInstalledPwa } from '@/lib/pwa';
import { playTestTone } from '@/lib/speechWeb';
import { SPEECH_RATES, showVoiceCheck, speakSwedish, type SpeechSpeed } from '@/lib/speech';
import { type ThemePreference, useTheme } from '@/theme/ThemeContext';
import { fonts, readerSizes, type ReaderSize, space } from '@/theme/tokens';

export default function SettingsScreen() {
  const t = useTheme();
  const db = useSQLiteContext();
  const { settings, update } = useSettings();
  const [busy, setBusy] = useState<string | null>(null);

  const backup = async () => {
    setBusy('backup');
    try {
      const { name, json } = await createBackupJson(db);
      shareFile(name, json);
    } catch (e) {
      showAlert('Backup failed', (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/json', '*/*'], copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.length) return;
    showAlert('Restore this backup?', 'Your current progress, words and results will be replaced by the backup.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: async () => {
          setBusy('restore');
          try {
            const { rows } = await restoreBackup(db, res.assets![0].uri);
            showAlert('Restored', `${rows} records were restored.`);
          } catch (e) {
            showAlert('Restore failed', (e as Error).message);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  };

  return (
    <Screen back="close" kicker="Inställningar" title="Settings">
      {!isInstalledPwa() ? (
        <Card tint={t.accentSoft} style={{ gap: space.sm, borderWidth: 0 }}>
          <AppText variant="subheading">Install Saga on your iPhone</AppText>
          <AppText>1. Open this page in <AppText style={{ fontFamily: fonts.uiBold }}>Safari</AppText>.</AppText>
          <AppText>2. Tap the <AppText style={{ fontFamily: fonts.uiBold }}>Share</AppText> button, then <AppText style={{ fontFamily: fonts.uiBold }}>Add to Home Screen</AppText>.</AppText>
          <AppText>3. Open Saga from the Home Screen. It works offline after the first start.</AppText>
          <AppText variant="caption" tone="soft">
            Your words and progress are stored on this phone. Use “Export backup” below now and then.
          </AppText>
        </Card>
      ) : null}

      <Card style={{ gap: space.lg }}>
        <AppText variant="subheading">Reading</AppText>
        <View style={{ gap: space.sm }}>
          <AppText tone="soft">Text size</AppText>
          <View style={styles.chips}>
            {(Object.keys(readerSizes) as ReaderSize[]).map((s) => (
              <Chip key={s} label={s} selected={settings.readerSize === s} onPress={() => update('readerSize', s)} />
            ))}
          </View>
          <AppText style={{ fontFamily: fonts.read, fontSize: readerSizes[settings.readerSize].font, lineHeight: readerSizes[settings.readerSize].line, color: t.ink }}>
            Flickan gick långsamt genom den gamla skogen.
          </AppText>
        </View>
        <Divider />
        <Row label="English summary button" detail="Show a small “English summary” helper on story pages." value={settings.englishHelp} onChange={(v) => update('englishHelp', v)} />
        <Row label="Haptic feedback" detail="A gentle tap when you look up a word or answer." value={settings.haptics} onChange={(v) => update('haptics', v)} />
        <Divider />
        <View style={{ gap: space.sm }}>
          <AppText tone="soft">Appearance</AppText>
          <View style={styles.chips}>
            {(['system', 'light', 'dark'] as ThemePreference[]).map((p) => (
              <Chip key={p} label={p === 'system' ? 'Automatic' : p === 'light' ? 'Light' : 'Night'} selected={settings.theme === p} onPress={() => update('theme', p)} />
            ))}
          </View>
        </View>
        <Divider />
        <View style={{ gap: space.sm }}>
          <AppText tone="soft">Read-aloud speed</AppText>
          <View style={styles.chips}>
            {(['slow', 'normal', 'fast'] as SpeechSpeed[]).map((s) => (
              <Chip
                key={s}
                label={s === 'slow' ? 'Slow' : s === 'normal' ? 'Normal' : 'Fast'}
                selected={settings.speechSpeed === s}
                onPress={async () => {
                  await update('speechSpeed', s);
                  void speakSwedish('Hej! Välkommen till Saga.', SPEECH_RATES[s]);
                }}
              />
            ))}
          </View>
        </View>
        <View style={{ gap: space.sm }}>
          <AppText tone="soft">Pronunciation uses the iPhone’s Swedish voice. If you hear an English accent, add a Swedish voice in Settings › Accessibility › Spoken Content › Voices. Make sure the silent switch is off.</AppText>
          <Button compact kind="secondary" icon="speaker" title="Test the voice" onPress={() => speakSwedish('Hej! Välkommen till Saga.')} />
          <Button compact kind="ghost" icon="info" title="Voice check (if there is no sound)" onPress={() => showVoiceCheck()} />
          <Button compact kind="ghost" icon="speaker" title="Play test tone (a short beep)" onPress={playTestTone} />
        </View>
      </Card>

      <Card style={{ gap: space.md }}>
        <AppText variant="subheading">Backup</AppText>
        <AppText tone="soft">Save all your progress, words and results to a file (for example in iCloud Drive), and restore it later or on a new phone.</AppText>
        <Button title="Export backup" icon="share" loading={busy === 'backup'} onPress={backup} />
        <Button title="Restore from backup" icon="download" kind="secondary" loading={busy === 'restore'} onPress={restore} />
        <AppText variant="caption" tone="faint">
          Imported stories are not part of the backup – export them from each book page as a story package.
        </AppText>
      </Card>

      <Card style={{ gap: space.md }}>
        <AppText variant="subheading">About</AppText>
        <AppText tone="soft">
          Saga – Swedish stories. Everything works offline: the stories, the dictionary, the grammar lessons and your data stay on this iPhone. The illustrations are original artwork made for this app.
        </AppText>
        <Button
          title="Reset all progress"
          kind="danger"
          icon="trash"
          onPress={() =>
            showAlert('Reset everything?', 'This deletes your reading progress, saved words and results. It cannot be undone.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: () => resetAllProgress(db) },
            ])
          }
        />
      </Card>
    </Screen>
  );
}

function Row({ label, detail, value, onChange }: { label: string; detail: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{label}</AppText>
        <AppText variant="caption" tone="soft">
          {detail}
        </AppText>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent }} accessibilityLabel={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
});
