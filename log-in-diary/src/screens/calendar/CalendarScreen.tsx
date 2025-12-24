import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { listEntriesByMonth } from "../../data/firebase/diaryRepo";

export default function CalendarScreen({ navigation }: any) {
  const { user } = useAuth();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const enabled = Boolean(user?.uid);

  const { data, isLoading, error } = useQuery({
    queryKey: ["entriesByMonth", user?.uid, month],
    queryFn: () => listEntriesByMonth(user!.uid, month),
    enabled,
    staleTime: 10_000,
  });

  const markedDates = useMemo(() => {
    const m: Record<string, any> = {};
    (data ?? []).forEach((e: any) => {
      if (!e?.date) return;
      m[e.date] = { marked: true, dotColor: "#6b6bd6" };
    });

    const today = dayjs().format("YYYY-MM-DD");
    m[today] = {
      ...(m[today] ?? {}),
      marked: true,
      dotColor: "#6b6bd6",
      selected: true,
      selectedColor: "rgba(40,40,160,0.12)",
    };

    return m;
  }, [data]);

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Calendar
        current={month + "-01"}
        markedDates={markedDates}
        onDayPress={(d) => {
          const dateId = d.dateString; // YYYY-MM-DD
          navigation.navigate("DayDetail", { date: dateId });
        }}
        onMonthChange={(m) => {
          setMonth(dayjs(m.dateString).format("YYYY-MM"));
        }}
      />

      <View style={{ paddingTop: 12 }}>
        {isLoading && <Text>불러오는 중...</Text>}
        {error && <Text>에러가 발생했습니다.</Text>}
        <Text style={{ opacity: 0.6 }}>이번 달 기록: {(data ?? []).length}일</Text>
      </View>
    </View>
  );
}
