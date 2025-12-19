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

// ✅ 경로 수정 (중요)
import RecentDiaryListScreen from "../../screens/home/components/RecentDiaryListScreen";

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Signup: undefined;
  Forgot: undefined;

  DayDetail: { date: string };

  // ✅ 추가: Recent 목록 화면
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
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="RecentDiaryList"
            component={RecentDiaryListScreen}
            options={{ title: "최근 나의 일기" }}
          />

          <Stack.Screen
            name="DayDetail"
            component={DayDetailScreen}
            options={{
              headerShown: true,
              title: "일기 상세",
              presentation: "card",
            }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Forgot"
            component={ForgotPasswordScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
