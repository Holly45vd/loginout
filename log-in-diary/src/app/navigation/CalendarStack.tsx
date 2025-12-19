import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import CalendarScreen from "../../screens/calendar/CalendarScreen";
import DayDetailScreen from "../../screens/calendar/DayDetailScreen";
import EntryEditorScreen from "../../screens/entry/EntryEditorScreen";

export type CalendarStackParamList = {
  Calendar: undefined;
  DayDetail: { date: string };
  Write: { date?: string } | undefined;
};

const Stack = createNativeStackNavigator<CalendarStackParamList>();

export default function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Calendar" component={CalendarScreen} />
      <Stack.Screen name="DayDetail" component={DayDetailScreen} />
      <Stack.Screen name="Write" component={EntryEditorScreen} />
    </Stack.Navigator>
  );
}
