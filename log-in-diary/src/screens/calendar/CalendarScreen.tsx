import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { listEntriesByMonth } from "../../data/firebase/diaryRepo";

const moodToDot = (mood?: string) => {
  return { marked: true, dotColor: "#6b6bd6" };
};

export default function CalendarScreen({ navigation }: any) {
  const { user } = useAuth();
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));

  const enabled = Boolean(user?.uid);

  const { data, isLoading, error } = useQuery({
    queryKey: ["entries", user?.uid, month],
    queryFn: () => listEntriesByMonth(user!.uid, month),
    enabled,
    staleTime: 60_000,
  });

  const markedDates = useMemo(() => {
    const map: Record<string, any> = {};
    (data ?? []).forEach((e: any) => {
      map[e.date] = moodToDot(e.mood);
    });
    return map;
  }, [data]);

  if (!user) {
    return (
      <View style={{ padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text variant="titleLarge" style={{ textAlign: "center", marginBottom: 10 }}>
        캘린더
      </Text>

      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => {
          // ✅ 같은 CalendarStack 안의 DayDetail로 이동
          navigation.navigate("DayDetail", {
            date: day.dateString,
          });
        }}
        onMonthChange={(m) => {
          setMonth(dayjs(m.dateString).format("YYYY-MM"));
        }}
      />

      <View style={{ paddingTop: 12 }}>
        {isLoading && <Text>불러오는 중...</Text>}
        {error && <Text>에러가 발생했습니다.</Text>}
        <Text style={{ opacity: 0.6 }}>
          이번 달 기록: {(data ?? []).length}일
        </Text>
      </View>
    </View>
  );
}
