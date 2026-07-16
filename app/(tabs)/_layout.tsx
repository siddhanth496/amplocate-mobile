import { Tabs } from 'expo-router';
import { Map, Route, Gauge, Car, User } from 'lucide-react-native';
import { colors, font } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(15,17,20,0.98)',
          borderTopColor: colors.line,
          height: 84,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontFamily: font.semi, fontSize: 10 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{
        title: 'Discover',
        tabBarIcon: ({ color }) => <Map size={22} color={color} />,
      }} />
      <Tabs.Screen name="trip" options={{
        title: 'Trip',
        tabBarIcon: ({ color }) => <Route size={22} color={color} />,
      }} />
      <Tabs.Screen name="dashboard" options={{
        title: 'Stats',
        tabBarIcon: ({ color }) => <Gauge size={22} color={color} />,
      }} />
      <Tabs.Screen name="garage" options={{
        title: 'Garage',
        tabBarIcon: ({ color }) => <Car size={22} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => <User size={22} color={color} />,
      }} />
    </Tabs>
  );
}
