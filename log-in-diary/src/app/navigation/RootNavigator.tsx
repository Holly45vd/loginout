import React from "react";
import { View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator } from "react-native-paper";

import { useAuth } from "../providers/AuthProvider";

import MainTabs from "./MainTabs";

import LoginScreen from "../../screens/auth/LoginScreen";
import SignupScreen from "../../screens/auth/SignupScreen";
import ForgotPasswordScreen from "../../screens/auth/ForgotPasswordScreen";

import DayDetailScreen from "../../screens/calendar/DayDetailScreen";
import RecentDiaryListScreen from "../../screens/home/components/RecentDiaryListScreen";

export type RootStackParamList = {
  // Auth
  Login: undefined;
  Signup: undefined;
  Forgot: undefined;

  // Main
  Main: undefined;

  // Root-level 집중 화면 (탭바 숨김)
  DayDetail: { date: string };
  RecentDiaryList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="DayDetail" component={DayDetailScreen} />
          <Stack.Screen name="RecentDiaryList" component={RecentDiaryListScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
