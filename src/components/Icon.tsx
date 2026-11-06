import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { Text } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';

/**
 * Icon names used in the app, mapped to SF Symbols (iOS) and Material Symbols (Android/web).
 * Keeping the mapping in one place makes the icon language consistent.
 */
const ICONS = {
  book: ['book.closed', 'menu_book'],
  bookFill: ['book.closed.fill', 'menu_book'],
  books: ['books.vertical', 'library_books'],
  home: ['house', 'home'],
  vocabulary: ['character.book.closed', 'translate'],
  practice: ['pencil.and.outline', 'edit_note'],
  progress: ['chart.bar.xaxis', 'bar_chart'],
  settings: ['gearshape', 'settings'],
  close: ['xmark', 'close'],
  back: ['chevron.left', 'arrow_back_ios'],
  forward: ['chevron.right', 'arrow_forward_ios'],
  down: ['chevron.down', 'expand_more'],
  bookmark: ['bookmark', 'bookmark_border'],
  bookmarkFill: ['bookmark.fill', 'bookmark'],
  list: ['list.bullet', 'list'],
  plus: ['plus', 'add'],
  check: ['checkmark', 'check'],
  checkCircle: ['checkmark.circle.fill', 'check_circle'],
  xCircle: ['xmark.circle.fill', 'cancel'],
  star: ['star.fill', 'star'],
  sparkles: ['sparkles', 'auto_awesome'],
  search: ['magnifyingglass', 'search'],
  trash: ['trash', 'delete'],
  share: ['square.and.arrow.up', 'ios_share'],
  download: ['square.and.arrow.down', 'download'],
  import: ['tray.and.arrow.down', 'file_download'],
  clock: ['clock', 'schedule'],
  flame: ['flame', 'local_fire_department'],
  globe: ['globe.europe.africa', 'public'],
  graduation: ['graduationcap', 'school'],
  cards: ['rectangle.on.rectangle.angled', 'style'],
  brain: ['brain.head.profile', 'psychology'],
  textformat: ['textformat.size', 'format_size'],
  info: ['info.circle', 'info'],
  lightbulb: ['lightbulb', 'lightbulb'],
  quote: ['quote.opening', 'format_quote'],
  arrowRight: ['arrow.right', 'arrow_forward'],
  repeat: ['arrow.counterclockwise', 'replay'],
  play: ['play.fill', 'play_arrow'],
  stop: ['stop.fill', 'stop'],
  speaker: ['speaker.wave.2', 'volume_up'],
  sliders: ['slider.horizontal.3', 'tune'],
  map: ['map', 'map'],
  leaf: ['leaf', 'eco'],
  doc: ['doc.text', 'description'],
  warning: ['exclamationmark.triangle', 'warning'],
  eye: ['eye', 'visibility'],
  lock: ['lock', 'lock'],
  crown: ['crown', 'workspace_premium'],
  pencil: ['pencil', 'edit'],
  text: ['text.alignleft', 'notes'],
  translate: ['character.bubble', 'translate'],
} as const;

export type IconName = keyof typeof ICONS;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  weight?: SymbolViewProps['weight'];
  style?: StyleProp<ViewStyle>;
}

export function Icon({ name, size = 20, color, weight = 'medium', style }: IconProps) {
  const t = useTheme();
  const [ios, md] = ICONS[name];
  return (
    <SymbolView
      name={{ ios, android: md, web: md } as SymbolViewProps['name']}
      size={size}
      tintColor={color ?? t.ink}
      weight={weight}
      style={[{ width: size, height: size }, style]}
      fallback={<Text style={{ fontSize: size * 0.8, color: (color as string) ?? t.ink }}>•</Text>}
    />
  );
}
