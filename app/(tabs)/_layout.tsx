import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        tabBarInactiveTintColor: '#8D6E63',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelPosition: 'beside-icon', // Places text horizontally centered
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '700',
        },
        tabBarStyle: {
          height: 52,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F5EBE6',
          paddingBottom: 0, // Removes extra padding reserved for icons
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: () => null, // Removes the icon
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: () => null, // Removes the icon
        }}
      />
    </Tabs>
  );
}
