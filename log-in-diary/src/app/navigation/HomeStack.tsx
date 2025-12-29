// /workspaces/loginout/log-in-diary/src/app/navigation/HomeStack.tsx
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../../screens/home/HomeScreen";
import RecentDiaryListScreen from "../../screens/home/components/RecentDiaryListScreen";

export type HomeStackParamList = {
  Home: undefined;
  RecentDiaryList: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="RecentDiaryList" component={RecentDiaryListScreen} />
    </Stack.Navigator>
  );
}
