import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import MyTabs from "./Screens";
import Settings from "../screens/Settings";

const Tab = createStackNavigator();

export default function MinorScreen() {
    return (
        <Tab.Navigator initialRouteName="Main">
          <Tab.Screen name="Main" component={MyTabs} options={{headerShown:false}} />
          <Tab.Screen name="Settings" component={Settings} />
        </Tab.Navigator>
    );
}
