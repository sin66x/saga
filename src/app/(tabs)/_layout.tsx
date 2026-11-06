import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { TabBarInsetContext } from '@/components/TabBarInset';
import { useTheme } from '@/theme/ThemeContext';
import { fonts, space } from '@/theme/tokens';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'books', title: 'Books', icon: 'books' },
  { name: 'vocabulary', title: 'Words', icon: 'vocabulary' },
  { name: 'practice', title: 'Practice', icon: 'practice' },
  { name: 'progress', title: 'Progress', icon: 'progress' },
];

/**
 * Web / installed-PWA version of the tab bar: a regular bottom bar. (The native tab bar
 * used on iOS has only a basic fallback in browsers that floats at the top.)
 */
export default function WebTabLayout() {
  const t = useTheme();
  const bottom = Math.max(useSafeAreaInsets().bottom, 8);
  return (
    // This bar sits below the content (not over it), so screens only need a little breathing room.
    <TabBarInsetContext value={space.xxl}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: t.accent,
          tabBarInactiveTintColor: t.inkFaint,
          tabBarLabelStyle: { fontFamily: fonts.uiSemi, fontSize: 11 },
          tabBarStyle: { backgroundColor: t.paper, borderTopColor: t.line, borderTopWidth: 1, height: 58 + bottom, paddingTop: 6, paddingBottom: bottom },
          sceneStyle: { backgroundColor: t.background },
        }}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title, tabBarIcon: ({ color }) => <Icon name={tab.icon} size={22} color={color} /> }}
          />
        ))}
      </Tabs>
    </TabBarInsetContext>
  );
}
