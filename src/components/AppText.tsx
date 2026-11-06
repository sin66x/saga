import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { fonts } from '@/theme/tokens';

export type TextVariant =
  | 'hero' // big Fraunces title
  | 'title' // screen titles
  | 'heading' // section titles
  | 'subheading'
  | 'swedish' // Swedish display text (Fraunces italic)
  | 'body'
  | 'bodyStrong'
  | 'reading' // story / Swedish sentence text (Literata)
  | 'readingItalic'
  | 'caption'
  | 'label' // small caps-like labels
  | 'number'; // statistics

type Tone = 'default' | 'soft' | 'faint' | 'accent' | 'blue' | 'green' | 'gold' | 'success' | 'error' | 'inverse';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
}

const variants: Record<TextVariant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.4 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, letterSpacing: -0.2 },
  heading: { fontFamily: fonts.display, fontSize: 21, lineHeight: 27 },
  subheading: { fontFamily: fonts.uiBold, fontSize: 17, lineHeight: 23 },
  swedish: { fontFamily: fonts.displayItalic, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 23 },
  bodyStrong: { fontFamily: fonts.uiBold, fontSize: 16, lineHeight: 23 },
  reading: { fontFamily: fonts.read, fontSize: 18, lineHeight: 28 },
  readingItalic: { fontFamily: fonts.readItalic, fontSize: 17, lineHeight: 26 },
  caption: { fontFamily: fonts.ui, fontSize: 13.5, lineHeight: 18 },
  label: { fontFamily: fonts.uiHeavy, fontSize: 11.5, lineHeight: 15, letterSpacing: 1.1, textTransform: 'uppercase' },
  number: { fontFamily: fonts.display, fontSize: 30, lineHeight: 34 },
};

export function AppText({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const t = useTheme();
  const color = {
    default: t.ink,
    soft: t.inkSoft,
    faint: t.inkFaint,
    accent: t.accent,
    blue: t.blue,
    green: t.green,
    gold: t.gold,
    success: t.success,
    error: t.error,
    inverse: t.accentInk,
  }[tone];
  return <Text maxFontSizeMultiplier={1.6} {...rest} style={[variants[variant], { color }, align ? { textAlign: align } : null, style]} />;
}

export const textStyles = StyleSheet.create(variants);
