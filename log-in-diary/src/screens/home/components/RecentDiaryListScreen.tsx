import React, { useMemo, useState } from "react";
import { View, ScrollView, Pressable } from "react-native";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Card, Text, Chip } from "react-native-paper";

import { useAuth } from "../../../app/providers/AuthProvider";
import { listEntriesByRange } from "../../../data/firebase/diaryRepo";

// mood 키 -> 이모지 매핑
const MOOD_ICON: Record<string, string> = {
  anxiety: "🌩️",
  coldness: "☁️",
  lethargy: "🌧️",
  lonely: "🌙",
  calm: "🌤️",
  sadness: "🌫️",
  happiness: "☀️",
  hope: "🌈",
  growth: "🌱",
  confident: "🔥",
};

const energyLabel = (n?: number) => {
  switch (n) {
    case 1:
      return "방전";
    case 2:
      return "저전력";
    case 3:
      return "보통";
    case 4:
      return "충전됨";
    case 5:
      return "풀충전";
    default:
      return "-";
  }
};

const DOW = ["일", "월", "화", "수", "목", "금", "토"] as const;

type Item = {
  dateId: string;
  title: string;   // 예: "12.19 (금)"
  time: string;    // 예: "09:00" (없으면 "--:--")
  icon: string;
  energy: string;
  snippet: string;
};

export default function RecentDiaryListScreen({ navigation }: any) {
  const { user } = useAuth();

  const today = dayjs();
  const todayId = today.format("YYYY-MM-DD");

  // ✅ 이미지처럼 “주간” 컨텍스트 + 그 주의 기록 타임라인 느낌 추천
  const weekStart = today.startOf("week"); // 일요일 시작
  const weekEnd = weekStart.add(6, "day");

  const rangeStart = weekStart.format("YYYY-MM-DD");
  const rangeEnd = weekEnd.format("YYYY-MM-DD");

  const enabled = Boolean(user?.uid);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["entriesRangeWeek", user?.uid, rangeStart, rangeEnd],
    queryFn: () => listEntriesByRange(user!.uid, rangeStart, rangeEnd),
    enabled,
    staleTime: 60_000,
  });

  // ✅ “선택된 카드” 강조(파란 카드). 기본은 최신(오늘/가장 최근)으로.
  const items: Item[] = useMemo(() => {
    const list = (entries ?? []).slice().sort((a: any, b: any) => (a.date < b.date ? 1 : -1)); // 최신순
    return list.map((e: any) => ({
      dateId: e.date,
      title: dayjs(e.date).format("MM.DD (dd)"),
      time: e.time ? String(e.time) : "--:--", // time 필드가 없으면 표시만
      icon: MOOD_ICON[e.mood] ?? "🙂",
      energy: energyLabel(e.energy),
      snippet: String(e.content ?? "").trim(),
    }));
  }, [entries]);

  const defaultSelected = items.find((x) => x.dateId === todayId)?.dateId ?? items[0]?.dateId ?? "";
  const [selectedId, setSelectedId] = useState(defaultSelected);

  const headerDateText = today.format("MMM D, YYYY"); // 영어가 싫으면 포맷 바꿔도 됨

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* ===== Header ===== */}
        <Text style={{ opacity: 0.6, marginBottom: 4 }}>{headerDateText}</Text>
        <Text style={{ fontSize: 34, fontWeight: "900" as any, marginBottom: 14 }}>Today</Text>

        {/* ===== Week Strip ===== */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 18 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = weekStart.add(i, "day");
            const isToday = d.format("YYYY-MM-DD") === todayId;
            return (
              <View key={i} style={{ alignItems: "center", width: 42 }}>
                <Text style={{ opacity: 0.55, fontWeight: "700" as any }}>{DOW[i]}</Text>
                <View
                  style={{
                    marginTop: 6,
                    width: 30,
                    height: 30,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isToday ? "#2F80ED" : "transparent",
                  }}
                >
                  <Text style={{ fontWeight: "900" as any, color: isToday ? "#fff" : "#111" }}>
                    {d.date()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ===== Timeline List ===== */}
        {isLoading ? (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ paddingVertical: 22, alignItems: "center" }}>
              <Text style={{ opacity: 0.7 }}>불러오는 중…</Text>
            </Card.Content>
          </Card>
        ) : items.length === 0 ? (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ paddingVertical: 22, alignItems: "center" }}>
              <Text style={{ fontSize: 26 }}>📝</Text>
              <Text style={{ opacity: 0.7 }}>이번 주 기록 없음</Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {items.map((it, idx) => {
              const selected = it.dateId === selectedId;

              return (
                <View key={it.dateId} style={{ flexDirection: "row", alignItems: "stretch" }}>
                  {/* Left rail */}
                  <View style={{ width: 28, alignItems: "center" }}>
                    <View
                      style={{
                        marginTop: 18,
                        width: 12,
                        height: 12,
                        borderRadius: 999,
                        borderWidth: 2,
                        borderColor: "#2F80ED",
                        backgroundColor: selected ? "#2F80ED" : "#fff",
                      }}
                    />
                    <View
                      style={{
                        flex: 1,
                        width: 2,
                        backgroundColor: "rgba(47,128,237,0.20)",
                        marginTop: 6,
                      }}
                    />
                  </View>

                  {/* Right content */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ opacity: 0.55, fontWeight: "800" as any, marginBottom: 6 }}>
                      {it.time}
                    </Text>

                    <Pressable
                      onPress={() => {
                        setSelectedId(it.dateId); // 선택 강조
                        navigation.navigate("DayDetail", { date: it.dateId }); // 상세 이동
                      }}
                    >
                      <View
                        style={{
                          borderRadius: 18,
                          padding: 14,
                          backgroundColor: selected ? "#2F80ED" : "#F4F6F8",
                        }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <Text
                            style={{
                              fontWeight: "900" as any,
                              color: selected ? "#fff" : "#111",
                            }}
                          >
                            {it.title}
                          </Text>
                          <Chip
                            compact
                            style={{
                              backgroundColor: selected ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.06)",
                            }}
                            textStyle={{ color: selected ? "#fff" : "#111", fontWeight: "800" as any }}
                          >
                            {it.energy}
                          </Chip>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                          <Text style={{ fontSize: 28 }}>{it.icon}</Text>
                          <Text
                            numberOfLines={2}
                            style={{
                              flex: 1,
                              color: selected ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.70)",
                              fontWeight: selected ? ("700" as any) : ("500" as any),
                            }}
                          >
                            {it.snippet || "내용 없음"}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
