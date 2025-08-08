import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CheckInScreen from '../screens/CheckInScreen';
import LocationScreen from '../screens/LocationScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="CheckIn" 
        component={CheckInScreen}
        options={{
          tabBarLabel: 'Check In',
        }}
      />
      <Tab.Screen 
        name="Location" 
        component={LocationScreen}
        options={{
          tabBarLabel: 'Location',
        }}
      />
    </Tab.Navigator>
  );
}
