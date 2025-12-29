// /workspaces/loginout/log-in-diary/src/screens/home/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, Pressable, Image, Platform, Alert } from "react-native";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, Text, Chip, Button, IconButton, Snackbar, Surface, useTheme } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { getEntry, listEntriesByRange, deleteEntry } from "../../data/firebase/diaryRepo";
import QuoteCard from "./components/QuoteCard";
import { getDailyQuote, getQuoteClosedToday, setQuoteClosedToday, reopenQuoteToday } from "../../utils/dailyQuote";
import { MOOD_IMAGE, DEFAULT_MOOD_IMAGE, MoodKey } from "../../assets/moodImages";

const DOW_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const dow3 = (id: string) => DOW_EN[dayjs(id).day()] ?? "Day";

function energyLabel(n?: number) {
  switch (n) {
    case 1: return "방전";
    case 2: return "저전력";
    case 3: return "보통";
    case 4: return "충전됨";
    case 5: return "풀충전";
    default: return "-";
  }
}
function getMoodAsset(mood?: string) {
  const key = (mood ?? "") as MoodKey;
  const hit = (MOOD_IMAGE as any)[key];
  return hit?.active ?? DEFAULT_MOOD_IMAGE.active;
}
function askConfirm(title: string, message: string) {
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
function getRootLikeNav(navigation: any) {
  return navigation?.getParent?.()?.getParent?.() ?? navigation?.getParent?.() ?? navigation;
}

type EntryLite = { date: string; mood?: string; energy?: number; content?: string };

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const theme = useTheme();

  const PRIMARY = theme.colors.primary;
  const BORDER = "rgba(0,0,0,0.08)";
  const TEXT_DIM = "rgba(0,0,0,0.60)";
  const BG_SOFT = "rgba(0,0,0,0.03)";
  const LINE = `${PRIMARY}33`;

  const enabled = Boolean(user?.uid);
  const rootNav = useMemo(() => getRootLikeNav(navigation), [navigation]);

  const todayId = dayjs().format("YYYY-MM-DD");
  const rangeStart = dayjs().subtract(6, "day").format("YYYY-MM-DD");
  const rangeEnd = todayId;

  const [snack, setSnack] = useState({ open: false, text: "" });
  const openSnack = useCallback((text: string) => setSnack({ open: true, text }), []);

  // ===== Today =====
  const { data: todayEntry, isLoading: loadingToday } = useQuery({
    queryKey: ["entry", user?.uid, todayId],
    queryFn: () => getEntry(user!.uid, todayId),
    enabled,
    staleTime: 30_000,
  });

  const hasToday = Boolean(todayEntry);
  const todayMoodImg = hasToday ? getMoodAsset((todayEntry as any)?.mood) : DEFAULT_MOOD_IMAGE.normal;
  const todayEnergy = hasToday ? energyLabel((todayEntry as any)?.energy) : "기록 없음";
  const todaySnippet = hasToday ? String((todayEntry as any)?.content ?? "").trim() : "오늘 기록을 남겨볼까?";

  // ===== Quote =====
  const [quoteOpen, setQuoteOpen] = useState(false);
  useEffect(() => {
    (async () => setQuoteOpen(!(await getQuoteClosedToday())))();
  }, []);

  const { data: dailyQuote, isLoading: quoteLoading } = useQuery({
    queryKey: ["dailyQuote", user?.uid],
    queryFn: () => getDailyQuote(user?.uid),
    enabled,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // ===== Week (single range) =====
  const { data: entriesRaw, isLoading: loadingWeek } = useQuery({
    queryKey: ["entriesRange7", user?.uid, rangeStart, rangeEnd],
    queryFn: () => listEntriesByRange(user!.uid, rangeStart, rangeEnd),
    enabled,
    staleTime: 30_000,
  });

  const entries = (entriesRaw ?? []) as EntryLite[];
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);

  const days7 = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const id = dayjs(rangeStart).add(i, "day").format("YYYY-MM-DD");
      return { id, dow: dow3(id), dayNum: dayjs(id).date(), hasEntry: entryMap.has(id) };
    });
  }, [rangeStart, entryMap]);

  const [selectedId, setSelectedId] = useState(todayId);

  const goWrite = useCallback(
    (dateId: string) => rootNav.navigate("Main", { screen: "WriteTab", params: { date: dateId } }),
    [rootNav]
  );
  const goDetail = useCallback(
    (dateId: string) =>
      rootNav.navigate("Main", {
        screen: "CalendarTab",
        params: { screen: "DayDetail", params: { date: dateId } },
      }),
    [rootNav]
  );

  const onDelete = useCallback(
    async (dateId: string) => {
      if (!user?.uid) return;
      const ok = await askConfirm("삭제", "이 날짜의 기록을 삭제할까?");
      if (!ok) return;

      try {
        await deleteEntry(user.uid, dateId);
        qc.invalidateQueries({ queryKey: ["entriesRange7", user.uid, rangeStart, rangeEnd] });
        qc.invalidateQueries({ queryKey: ["entry", user.uid, dateId] });
        if (dateId === todayId) qc.invalidateQueries({ queryKey: ["entry", user.uid, todayId] });
        openSnack("삭제 완료");
      } catch {
        openSnack("삭제 실패. 다시 시도해줘.");
      }
    },
    [user?.uid, qc, rangeStart, rangeEnd, todayId, openSnack]
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}>
        {/* 1) TODAY (큰 아이콘) */}
        <Card style={{ borderRadius: 22, borderWidth: 1, borderColor: BORDER }}>
          <Card.Content style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 18, fontWeight: "900" as any }}>
                오늘 ({dayjs(todayId).format("MM-DD")})
              </Text>
              <Chip compact style={{ backgroundColor: "rgba(0,0,0,0.06)" }} textStyle={{ fontWeight: "900" as any }}>
                {hasToday ? todayEnergy : "기록 없음"}
              </Chip>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  backgroundColor: `${PRIMARY}12`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image source={todayMoodImg} resizeMode="contain" style={{ width: 52, height: 52 }} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ fontSize: 16, fontWeight: "900" as any }}>
                  {hasToday ? "오늘도 기록했네" : "오늘 기록해"}
                </Text>
                <Text style={{ color: TEXT_DIM }} numberOfLines={2}>
                  {loadingToday ? "불러오는 중…" : todaySnippet || "내용 없음"}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                mode="contained"
                onPress={() => goDetail(todayId)}
                style={{ flex: 1, borderRadius: 14 }}
                contentStyle={{ height: 44 }}
                disabled={!hasToday}
              >
                디테일
              </Button>
              <Button
                mode="outlined"
                onPress={() => goWrite(todayId)}
                style={{ flex: 1, borderRadius: 14 }}
                contentStyle={{ height: 44 }}
              >
                {hasToday ? "수정" : "기록"}
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* 2) QUOTE (그대로) */}
        <QuoteCard
          quoteOpen={quoteOpen}
          onToggle={async () => {
            if (quoteOpen) return setQuoteOpen(false);
            await reopenQuoteToday();
            setQuoteOpen(true);
          }}
          onCloseToday={async () => {
            await setQuoteClosedToday();
            setQuoteOpen(false);
          }}
          loading={quoteLoading}
          quoteText={dailyQuote?.text}
          quoteAuthor={dailyQuote?.author}
        />

        {/* 3) WEEK (알약 타이틀 + pills + 타임라인) */}


        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {days7.map((d) => {
            const selected = d.id === selectedId;
            return (
              <Pressable key={d.id} onPress={() => setSelectedId(d.id)} style={{ width: 48, alignItems: "center" }}>
                <View
                  style={{
                    height: 40,
                    minWidth: 48,
                    paddingHorizontal: 10,
                    borderRadius: 999,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: selected ? PRIMARY : "transparent",
                    borderWidth: selected ? 0 : 1,
                    borderColor: BORDER,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "900" as any, color: selected ? "#fff" : "#111" }}>
                    {d.dow}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "900" as any, color: selected ? "#fff" : "#111" }}>
                    {d.dayNum}
                  </Text>
                </View>

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

        {loadingWeek ? (
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
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .map((e, idx, arr) => {
                const dateId = e.date;
                const selected = dateId === selectedId;
                const isLast = idx === arr.length - 1;

                return (
                  <View key={dateId} style={{ flexDirection: "row", alignItems: "stretch" }}>
                    <View style={{ width: 26, alignItems: "center" }}>
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
                      {!isLast && <View style={{ flex: 1, width: 2, backgroundColor: LINE, marginTop: 6 }} />}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Pressable onPress={() => setSelectedId(dateId)}>
                        <View
                          style={{
                            borderRadius: 18,
                            padding: 14,
                            backgroundColor: selected ? PRIMARY : BG_SOFT,
                            borderWidth: selected ? 0 : 1,
                            borderColor: BORDER,
                          }}
                        >
                          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={{ fontWeight: "900" as any, color: selected ? "#fff" : "#111" }}>
                              {dow3(dateId)} {dayjs(dateId).format("MM.DD")}
                            </Text>

                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Chip
                                compact
                                style={{
                                  backgroundColor: selected ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.06)",
                                }}
                                textStyle={{ color: selected ? "#fff" : "#111", fontWeight: "900" as any }}
                              >
                                {energyLabel(e.energy)}
                              </Chip>

                              <IconButton
                                icon="file-document-outline"
                                size={18}
                                onPress={() => goDetail(dateId)}
                                iconColor={selected ? "#fff" : PRIMARY}
                                style={{ margin: 0 }}
                              />
                              <IconButton
                                icon="pencil"
                                size={18}
                                onPress={() => goWrite(dateId)}
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

                          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
                            <Image source={getMoodAsset(e.mood)} resizeMode="contain" style={{ width: 34, height: 34 }} />
                            <Text
                              numberOfLines={2}
                              style={{
                                flex: 1,
                                color: selected ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.70)",
                                fontWeight: selected ? ("700" as any) : ("500" as any),
                              }}
                            >
                              {String(e.content ?? "").trim() || "내용 없음"}
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

        
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
       

          <Pressable
            onPress={() => rootNav.navigate("Main", { screen: "CalendarTab", params: { screen: "Calendar" } })}
          >
            <Text style={{ fontWeight: "900" as any, color: PRIMARY }}>캘린더 →</Text>
          </Pressable>
        </View>
      </ScrollView>


      <Snackbar
        visible={snack.open}
        onDismiss={() => setSnack({ open: false, text: "" })}
        duration={1800}
        style={{ borderRadius: 12 }}
      >
        {snack.text}
      </Snackbar>
    </View>
  );
}
