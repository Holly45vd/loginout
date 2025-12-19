import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { Card, Text, Button, Surface } from "react-native-paper";
import dayjs from "dayjs";

const DOW = ["일", "월", "화", "수", "목", "금", "토"] as const;

type MiniDay = {
  id: string; // YYYY-MM-DD
  d: number; // day number
  mood: string; // emoji
  isToday: boolean;
};

type Props = {
  weekStart: string; // YYYY-MM-DD (startOf("week"))
  todayId: string;
  loading: boolean;
  miniEntries: Array<{ date: string; mood?: string }>;
  moodIconMap: Record<string, string>;
  onGoCalendar: () => void;
  onGoDayDetail: (dateId: string) => void;
};

export default function MiniWeekCalendar({
  weekStart,
  todayId,
  loading,
  miniEntries,
  moodIconMap,
  onGoCalendar,
  onGoDayDetail,
}: Props) {
  const miniMap = useMemo(() => {
    const m = new Map<string, any>();
    (miniEntries ?? []).forEach((e: any) => m.set(e.date, e));
    return m;
  }, [miniEntries]);

  // ✅ 7일만 생성 (일~토)
  const miniDays: MiniDay[] = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = dayjs(weekStart).add(i, "day");
      const id = date.format("YYYY-MM-DD");
      const e: any = miniMap.get(id);

      return {
        id,
        d: date.date(),
        mood: e ? moodIconMap[e.mood] ?? "🙂" : "·",
        isToday: id === todayId,
      };
    });
  }, [weekStart, miniMap, todayId, moodIconMap]);

  return (
    <Card style={{ borderRadius: 14 }}>
      <Card.Content style={{ gap: 10 }}>

        {/* 일월화수목금토 한 줄 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {DOW.map((w) => (
            <Text
              key={w}
              style={{ width: "13.5%", textAlign: "center", opacity: 0.8 }}
            >
              {w}
            </Text>
          ))}
        </View>

        {/* 7일만 */}
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {miniDays.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => onGoDayDetail(d.id)}
              style={{ width: "13.5%", alignItems: "center", paddingVertical: 6 }}
            >
              <Surface
                elevation={d.isToday ? 2 : 0}
                style={{
                  width: 44,
                  borderRadius: 12,
                  paddingVertical: 8,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: d.isToday
                    ? "rgba(40,40,120,0.7)"
                    : "rgba(0,0,0,0.08)",
                  backgroundColor: d.isToday
                    ? "rgba(40,40,120,0.06)"
                    : "rgba(255,255,255,0.9)",
                }}
              >
                <Text
                  style={{
                    fontWeight: d.isToday ? ("700" as any) : ("500" as any),
                  }}
                >
                  {d.d}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 16 }}>
                  {loading ? "·" : d.mood}
                </Text>
              </Surface>
            </Pressable>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}
