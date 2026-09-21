import { Tabs } from 'expo-router';
import { Home, Compass, Library, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors as c } from '@bastiat/design-tokens';
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.copper,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: '#102026',
          borderTopColor: c.border,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontFamily: 'DMSans_500Medium', fontSize: 10, marginTop: 3 },
        sceneStyle: { backgroundColor: c.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home color={color} size={22} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Compass color={color} size={22} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'My Library',
          tabBarIcon: ({ color }) => <Library color={color} size={22} strokeWidth={1.6} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <UserRound color={color} size={22} strokeWidth={1.6} />,
        }}
      />
    </Tabs>
  );
}
