// /workspaces/loginout/log-in-diary/src/screens/home/components/RecentDiaryListScreen.tsx
import React, { useMemo, useState, useCallback } from "react";
import { View, ScrollView, Pressable, Image, Platform, Alert } from "react-native";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Text, Chip, Button, IconButton } from "react-native-paper";

import { useAuth } from "../../../app/providers/AuthProvider";
import { listEntriesByRange, deleteEntry } from "../../../data/firebase/diaryRepo";
import { MOOD_IMAGE, DEFAULT_MOOD_IMAGE, MoodKey } from "../../../assets/moodImages";

/** ===== Theme (통일감) ===== */
const PRIMARY = "#2F80ED";
const BG_SOFT = "#F4F6F8";
const BORDER = "rgba(0,0,0,0.08)";
const TEXT_DIM = "rgba(0,0,0,0.60)";
const LINE = "rgba(47,128,237,0.20)";

/** ===== helpers ===== */
const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
function dow3(yyyyMMdd: string) {
  const idx = dayjs(yyyyMMdd).day();
  return DOW_EN[idx] ?? "Day";
}

function energyLabel(n?: number) {
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
}

function getMoodAsset(mood?: string) {
  const key = (mood ?? "") as MoodKey;
  const hit = (MOOD_IMAGE as any)[key];
  return hit?.active ?? DEFAULT_MOOD_IMAGE.active;
}

function askConfirm(title: string, message: string) {
  // Web: confirm, Native: Alert
  if (Platform.OS === "web") {
    // eslint-disable-next-line no-restricted-globals
    return Promise.resolve(typeof confirm === "function" ? confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(title, message, [
      { text: "취소", style: "cancel", onPress: () => resolve(false) },
      { text: "삭제", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

type EntryLite = {
  date: string; // YYYY-MM-DD
  mood?: string;
  energy?: number;
  content?: string;
};

export default function RecentDiaryListScreen({ navigation }: any) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const todayId = dayjs().format("YYYY-MM-DD");

  // ✅ 최근 7일(오늘이 맨 뒤): today-6 ... today
  const rangeStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");
  const rangeEnd = todayId;

  const enabled = Boolean(user?.uid);

  /** ===== entries (7일 범위) ===== */
  const { data: entriesRaw, isLoading } = useQuery({
    queryKey: ["entriesRange7", user?.uid, rangeStart, rangeEnd],
    queryFn: () => listEntriesByRange(user!.uid, rangeStart, rangeEnd),
    enabled,
    staleTime: 30_000,
  });

  const entries = (entriesRaw ?? []) as EntryLite[];

  // date -> entry map
  const entryMap = useMemo(() => {
    const m = new Map<string, EntryLite>();
    entries.forEach((e) => m.set(e.date, e));
    return m;
  }, [entries]);

  // ✅ 상단 7일 pills (오늘이 마지막에 오도록)
  const days7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const id = dayjs(rangeStart).add(i, "day").format("YYYY-MM-DD");
      const hasEntry = entryMap.has(id);
      return {
        id,
        dow: dow3(id),
        dayNum: dayjs(id).date(),
        hasEntry,
        isToday: id === todayId,
      };
    });
  }, [rangeStart, entryMap, todayId]);

  // 선택 날짜
  const [selectedId, setSelectedId] = useState<string>(todayId);

  const selectedEntry = entryMap.get(selectedId);
  const hasSelected = Boolean(selectedEntry);

  /** ===== navigation (핵심: RootStack -> Main -> Tab) ===== */
  const goWriteForDate = useCallback(
    (dateId: string) => {
      // ✅ RecentDiaryList는 RootStack 화면이므로 "Main -> WriteTab"으로 들어가야 함
      navigation.navigate("Main", {
        screen: "WriteTab",
        params: { date: dateId },
      });
    },
    [navigation]
  );

  const goDetailForDate = useCallback(
    (dateId: string) => {
      // ✅ 탭바 유지하려면: Main -> CalendarTab 내부 스택의 DayDetail로 이동
      navigation.navigate("Main", {
        screen: "CalendarTab",
        params: {
          screen: "DayDetail",
          params: { date: dateId },
        },
      });
    },
    [navigation]
  );

  const onPressPill = useCallback(
    (dateId: string) => {
      setSelectedId(dateId);
      // 기록 있으면 바로 디테일로 이동
      if (entryMap.has(dateId)) {
        goDetailForDate(dateId);
      }
    },
    [entryMap, goDetailForDate]
  );

  const onDelete = useCallback(
    async (dateId: string) => {
      if (!user?.uid) return;
      const ok = await askConfirm("삭제", "이 날짜의 기록을 삭제할까?");
      if (!ok) return;

      await deleteEntry(user.uid, dateId);

      // 캐시 갱신: 범위 + 해당 entry
      qc.invalidateQueries({ queryKey: ["entriesRange7", user.uid, rangeStart, rangeEnd] });
      qc.invalidateQueries({ queryKey: ["entry", user.uid, dateId] }); // 혹시 쓰는 곳 있으면 같이
    },
    [qc, rangeStart, rangeEnd, user?.uid]
  );

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }}>
        {/* Header */}
        <Text style={{ opacity: 0.6, marginBottom: 4 }}>
          {dayjs(selectedId).format("MMM D, YYYY")}
        </Text>
        <Text style={{ fontSize: 34, fontWeight: "900" as any, marginBottom: 14 }}>
          Week
        </Text>

        {/* ✅ 7-day pills */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 14 }}>
          {days7.map((d) => {
            const selected = d.id === selectedId;

            return (
              <Pressable
                key={d.id}
                onPress={() => onPressPill(d.id)}
                style={{ width: 52, alignItems: "center" }}
              >
                <View
                  style={{
                    height: 40,
                    minWidth: 52,
                    paddingHorizontal: 10,
                    borderRadius: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? PRIMARY : "transparent",
                    borderWidth: selected ? 0 : 1,
                    borderColor: BORDER,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "900" as any,
                      color: selected ? "#fff" : "#111",
                      lineHeight: 12,
                    }}
                  >
                    {d.dow}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "900" as any,
                      color: selected ? "#fff" : "#111",
                      marginTop: 1,
                    }}
                  >
                    {d.dayNum}
                  </Text>
                </View>

                {/* 기록 점 */}
                <View
                  style={{
                    marginTop: 6,
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    backgroundColor: d.hasEntry ? PRIMARY : "transparent",
                    opacity: d.hasEntry ? 1 : 0,
                  }}
                />
              </Pressable>
            );
          })}
        </View>

        {/* ✅ 선택 날짜에 기록 없으면: 작게 CTA만 (큰 디테일 카드 제거) */}
        {!hasSelected && (
          <Card style={{ borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: BORDER }}>
            <Card.Content style={{ gap: 8 }}>
              <Text style={{ fontWeight: "900" as any }}>
                {dow3(selectedId)} · {dayjs(selectedId).format("YYYY.MM.DD")}
              </Text>
              <Text style={{ color: TEXT_DIM }}>
                이 날짜에는 기록이 없어. 바로 작성할 수 있어.
              </Text>
              <Button
                mode="contained"
                onPress={() => goWriteForDate(selectedId)}
                style={{ borderRadius: 14, alignSelf: "flex-start" }}
                contentStyle={{ height: 40 }}
              >
                이 날짜에 기록하기
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Timeline list */}
        {isLoading ? (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ paddingVertical: 22, alignItems: "center" }}>
              <Text style={{ opacity: 0.7 }}>불러오는 중…</Text>
            </Card.Content>
          </Card>
        ) : entries.length === 0 ? (
          <Card style={{ borderRadius: 18 }}>
            <Card.Content style={{ paddingVertical: 22, alignItems: "center" }}>
              <Text style={{ fontSize: 26 }}>📝</Text>
              <Text style={{ opacity: 0.7 }}>최근 7일 기록 없음</Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={{ gap: 12 }}>
            {entries
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1)) // 최신 위
              .map((e, idx, arr) => {
                const dateId = e.date;
                const selected = dateId === selectedId;
                const isLast = idx === arr.length - 1;

                const title = `${dow3(dateId)} ${dayjs(dateId).format("MM.DD")}`;
                const moodImg = getMoodAsset(e.mood);
                const energy = energyLabel(e.energy);
                const snippet = String(e.content ?? "").trim() || "내용 없음";

                return (
                  <View key={dateId} style={{ flexDirection: "row", alignItems: "stretch" }}>
                    {/* ✅ 왼쪽 점 + 라인 */}
                    <View style={{ width: 28, alignItems: "center" }}>
                      <View
                        style={{
                          marginTop: 18,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          borderWidth: 2,
                          borderColor: PRIMARY,
                          backgroundColor: selected ? PRIMARY : "#fff",
                        }}
                      />
                      {!isLast && (
                        <View
                          style={{
                            flex: 1,
                            width: 2,
                            backgroundColor: LINE,
                            marginTop: 6,
                          }}
                        />
                      )}
                    </View>

                    {/* 카드 */}
                    <View style={{ flex: 1 }}>
                      <Pressable
                        onPress={() => {
                          setSelectedId(dateId);
                          goDetailForDate(dateId);
                        }}
                      >
                        <View
                          style={{
                            borderRadius: 18,
                            padding: 14,
                            backgroundColor: selected ? PRIMARY : BG_SOFT,
                          }}
                        >
                          {/* 상단: 타이틀 + 에너지 + 액션 */}
                          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                            <Text style={{ fontWeight: "900" as any, color: selected ? "#fff" : "#111" }}>
                              {title}
                            </Text>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Chip
                                compact
                                style={{
                                  backgroundColor: selected ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.06)",
                                }}
                                textStyle={{
                                  color: selected ? "#fff" : "#111",
                                  fontWeight: "800" as any,
                                }}
                              >
                                {energy}
                              </Chip>

                              {/* 수정/삭제 */}
                              <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => goWriteForDate(dateId)}
                                iconColor={selected ? "#fff" : PRIMARY}
                                style={{ margin: 0 }}
                              />
                              <IconButton
                                icon="trash-can-outline"
                                size={18}
                                onPress={() => onDelete(dateId)}
                                iconColor={selected ? "#fff" : "rgba(214,69,69,1)"}
                                style={{ margin: 0 }}
                              />
                            </View>
                          </View>

                          {/* 내용 */}
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                            <Image source={moodImg} resizeMode="contain" style={{ width: 34, height: 34 }} />
                            <Text
                              numberOfLines={2}
                              style={{
                                flex: 1,
                                color: selected ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.70)",
                                fontWeight: selected ? ("700" as any) : ("500" as any),
                              }}
                            >
                              {snippet}
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
