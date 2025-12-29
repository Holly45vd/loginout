import React, { useMemo } from "react";
import { View, Pressable, Image } from "react-native";
import { Card, Text, Button, Surface } from "react-native-paper";
import dayjs from "dayjs";

import { MOOD_IMAGE, DEFAULT_MOOD_IMAGE, MoodKey } from "../../../assets/moodImages";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type MiniDay = {
  id: string;     // YYYY-MM-DD
  d: number;      // day number
  moodImage: any; // image asset
  hasEntry: boolean;
  isToday: boolean;
};

type Props = {
  weekStart: string; // YYYY-MM-DD (원래 받던 값 유지)
  todayId: string;
  loading: boolean;
  miniEntries: Array<{ date: string; mood?: string }>;
  onGoCalendar: () => void;
  onGoDayDetail: (dateId: string) => void;
};

function getMoodAsset(mood?: string) {
  const key = (mood ?? "") as MoodKey;
  const hit = (MOOD_IMAGE as any)[key];
  return hit?.active ?? DEFAULT_MOOD_IMAGE.active;
}

export default function MiniWeekCalendar({
  weekStart,
  todayId,
  loading,
  miniEntries,
  onGoCalendar,
  onGoDayDetail,
}: Props) {
  const miniMap = useMemo(() => {
    const m = new Map<string, any>();
    (miniEntries ?? []).forEach((e: any) => m.set(e.date, e));
    return m;
  }, [miniEntries]);

  // ✅ weekStart 기준으로 7일 생성 (UI는 Sun~Sat 고정 표기)
  const miniDays: MiniDay[] = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = dayjs(weekStart).add(i, "day");
      const id = date.format("YYYY-MM-DD");
      const e: any = miniMap.get(id);

      return {
        id,
        d: date.date(),
        moodImage: e?.mood ? getMoodAsset(e.mood) : DEFAULT_MOOD_IMAGE.normal,
        hasEntry: Boolean(e),
        isToday: id === todayId,
      };
    });
  }, [weekStart, miniMap, todayId]);

  return (
    <Card style={{ borderRadius: 18 }}>
      <Card.Content style={{ gap: 10 }}>
        {/* 헤더 + CTA */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontWeight: "900" as any, fontSize: 16 }}>This Week</Text>
          <Button mode="text" onPress={onGoCalendar}>
            캘린더 →
          </Button>
        </View>

        {/* 요일 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {DOW.map((w) => (
            <View key={w} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ opacity: 0.6, fontWeight: "800" as any, fontSize: 12 }}>{w}</Text>
            </View>
          ))}
        </View>

        {/* 날짜 + 아이콘 */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {miniDays.map((d) => (
            <Pressable
              key={d.id}
              onPress={() => onGoDayDetail(d.id)}
              style={{ flex: 1 }}
            >
              <Surface
                elevation={d.isToday ? 2 : 0}
                style={{
                  borderRadius: 14,
                  paddingVertical: 10,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: d.isToday ? "rgba(47,128,237,0.60)" : "rgba(0,0,0,0.08)",
                  backgroundColor: d.isToday ? "rgba(47,128,237,0.08)" : "rgba(255,255,255,0.95)",
                }}
              >
                <Text style={{ fontWeight: d.isToday ? ("900" as any) : ("700" as any) }}>
                  {d.d}
                </Text>

                <View style={{ marginTop: 6, width: 28, height: 28, opacity: loading ? 0.4 : 1 }}>
                  <Image
                    source={d.hasEntry ? d.moodImage : DEFAULT_MOOD_IMAGE.normal}
                    resizeMode="contain"
                    style={{ width: 28, height: 28 }}
                  />
                </View>

                {/* 기록 유무 점 */}
                <View
                  style={{
                    marginTop: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: d.hasEntry ? "#2F80ED" : "transparent",
                    opacity: d.hasEntry ? 1 : 0,
                  }}
                />
              </Surface>
            </Pressable>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}
