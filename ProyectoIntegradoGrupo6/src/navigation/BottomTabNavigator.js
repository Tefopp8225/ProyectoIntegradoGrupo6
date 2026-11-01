// src/navigation/BottomTabNavigator.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0fbbe6',
        tabBarInactiveTintColor: '#111f7a',
        tabBarStyle: {
          backgroundColor: '#c8c8cb'
        },
        tabBarShowLabel: false
      }}
    >
    </Tab.Navigator>
  );
}