import React from "react";
import { createStackNavigator } from '@react-navigation/stack';
import MyTabs from "./Screens";
import Settings from "../screens/Settings";
import Login from "../screens/Login";
import Finger from "../screens/Finger";
import * as NOTICE from '../components/notices';

const Tab = createStackNavigator();

export default function MinorScreen() {
  return (
      <Tab.Navigator initialRouteName="Login">
        <Tab.Screen name="Main" component={MyTabs} options={{headerShown:false}} />
        <Tab.Screen name="Settings" component={Settings} />
        <Tab.Screen name="Login" component={Login} options={{headerShown:false}}/>
        <Tab.Screen name="Finger" component={Finger} options={({ route }) => ({ title: NOTICE.MANAGER_FINGER })}/>
      </Tab.Navigator>
  );
}
