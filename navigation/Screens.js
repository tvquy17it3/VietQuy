import React from "react";
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';

import Home from "../screens/Home";
import Settings from "../screens/Settings";
import Attend from "../screens/Attend";

const Tab = createBottomTabNavigator();

export default function MyTabs() {
  return (
      <Tab.Navigator
        barStyle={{ backgroundColor: 'white', color: '#0a7fd9' }}
        screenOptions={{
          labelStyle: { color: '#0a7fd9', fontWeight: 'bold',  marginBottom: 5 },
          headerShown: false,
          showIcon: true
        }}
      >
        <Tab.Screen
          style={{ color: 'white!important' }}
          name="Home"
          component={Home}
          options={{
              tabBarLabel: "Trang chủ",
              tabBarIcon: () => (
                <Icon name="home" size={20} color="#0a7fd9" />
              ),
          }}
        />
        <Tab.Screen
          name="Attend"
          component={Attend}
          options={{
              tabBarLabel: 'Chấm công',
              tabBarIcon: () => (
                  <Icon name="podcast" size={20} color="#0a7fd9" />
              ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
              tabBarLabel: 'Cài đặt',
              tabBarIcon: () => (
                  <Icon name="gear" size={20} color="#0a7fd9" />
              ),
          }}
        />
      </Tab.Navigator>
  );
}
