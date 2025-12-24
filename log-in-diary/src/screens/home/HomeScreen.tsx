import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { Text } from "react-native-paper";
import { Avatar, IconButton, Surface } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { getEntry, listEntriesByRange } from "../../data/firebase/diaryRepo";

import {
  getDailyQuote,
  getQuoteClosedToday,
  setQuoteClosedToday,
  reopenQuoteToday,
} from "../../utils/dailyQuote";

import QuoteCard from "./components/QuoteCard";
import TodayEntryCard from "./components/TodayEntryCard";
import MiniWeekCalendar from "./components/MiniWeekCalendar";
import EnergyCard from "./components/EnergyCard";
import RecentDiaryCarousel from "./components/RecentDiaryCarousel";

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

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();

  const todayId = dayjs().format("YYYY-MM-DD");
  const todayMMDD = dayjs().format("MM-DD");

  // 미니 캘린더(10일)
  const weekStart = dayjs().startOf("week").format("YYYY-MM-DD");
  const miniEnd = dayjs().startOf("week").add(9, "day").format("YYYY-MM-DD");

  // 최근 14일 범위(에너지 그래프 + 최근일기)
  const d14Start = dayjs().subtract(13, "day").format("YYYY-MM-DD");
  const d14End = todayId;

  const enabled = Boolean(user?.uid);

  // ====== 명언 ======
  const [quoteOpen, setQuoteOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const closed = await getQuoteClosedToday();
      setQuoteOpen(!closed);
    })();
  }, []);

  const { data: dailyQuote, isLoading: quoteLoading } = useQuery({
    queryKey: ["dailyQuote", user?.uid],
    queryFn: () => getDailyQuote(user?.uid),
    enabled: true,
    staleTime: 1000 * 60 * 60 * 24,
  });

  // ====== 오늘 기록 ======
  const { data: todayEntry, isLoading: loadingToday } = useQuery({
    queryKey: ["entry", user?.uid, todayId],
    queryFn: () => getEntry(user!.uid, todayId),
    enabled,
    staleTime: 30_000,
  });

  // ====== 미니캘린더(10일) ======
  const { data: miniEntries, isLoading: loadingMini } = useQuery({
    queryKey: ["entriesRangeMini", user?.uid, weekStart, miniEnd],
    queryFn: () => listEntriesByRange(user!.uid, weekStart, miniEnd),
    enabled,
    staleTime: 60_000,
  });

  // ====== 최근 14일 ======
  const { data: d14Entries, isLoading: loading14 } = useQuery({
    queryKey: ["entriesRange14", user?.uid, d14Start, d14End],
    queryFn: () => listEntriesByRange(user!.uid, d14Start, d14End),
    enabled,
    staleTime: 60_000,
  });

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  const hasToday = Boolean(todayEntry);

  const todayMoodIcon = hasToday
    ? MOOD_ICON[(todayEntry as any).mood] ?? "🙂"
    : "·";
  const todayEnergy = hasToday ? energyLabel((todayEntry as any).energy) : "-";
  const todayNote = hasToday ? String((todayEntry as any).content ?? "") : "";

  // 최근 14일 에너지 values
  const energy14Values = useMemo(() => {
    const list = (d14Entries ?? [])
      .slice()
      .sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
    const map = new Map(list.map((e: any) => [e.date, e]));
    return Array.from({ length: 14 }).map((_, i) => {
      const id = dayjs(d14Start).add(i, "day").format("YYYY-MM-DD");
      const e: any = map.get(id);
      const v = e?.energy ?? 0;
      return typeof v === "number" ? v : Number(v) || 0;
    });
  }, [d14Entries, d14Start]);

  // 최근 나의 일기 캐러셀(최근 6개)
  const recentCards = useMemo(() => {
    const list = (d14Entries ?? [])
      .slice()
      .sort((a: any, b: any) => (a.date < b.date ? 1 : -1))
      .slice(0, 6);

    return list.map((e: any) => ({
      dateId: e.date,
      label: dayjs(e.date).format("MM.DD"),
      icon: MOOD_ICON[e.mood] ?? "🙂",
      energy: energyLabel(e.energy),
      snippet: String(e.content ?? "").trim(),
    }));
  }, [d14Entries]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 96, gap: 14 }}
      >

        {/* ✅ 상단 헤더 */}
<Surface
  elevation={0}
  style={{
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 4,
  }}
>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
    {/* 프로필 동그라미 */}
    {user?.photoURL ? (
      <Avatar.Image size={44} source={{ uri: user.photoURL }} />
    ) : (
      <Avatar.Text size={44} label={(user?.displayName?.[0] ?? "H").toUpperCase()} />
    )}

    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 16, fontWeight: "900" as any }}>
        Hello {user?.displayName ?? "Holly"}
      </Text>
      <Text style={{ opacity: 0.65 }}>
        Today {dayjs().format("D MMM")}
      </Text>
    </View>
  </View>

  {/* 오른쪽 아이콘들 */}
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <IconButton
      icon="magnify"
      size={22}
      onPress={() => navigation.navigate("Search")} // 없으면 일단 주석
    />
    <IconButton
      icon="cog-outline"
      size={22}
      onPress={() => navigation.navigate("MyPage")} // 너 프로젝트에 MyPage 있으면 이걸로
    />
  </View>
</Surface>


      
        {/* 2) 오늘의 일기 */}
      <TodayEntryCard
  todayMMDD={todayMMDD}
  loading={loadingToday}
  hasEntry={hasToday}
  moodIcon={todayMoodIcon}
  energyText={todayEnergy}
  note={todayNote}
  onGoDetail={() => {
    const parent = navigation.getParent?.();
    (parent ?? navigation).navigate("CalendarTab", {
      screen: "DayDetail",
      params: { date: todayId },
    });
  }}
  onGoWrite={() => {
    const parent = navigation.getParent?.();
    (parent ?? navigation).navigate("WriteTab", {
      screen: "WriteHome",
      params: { date: todayId },
    });
  }}
/>

          {/* 1) 명언 */}
        <QuoteCard
          quoteOpen={quoteOpen}
          onToggle={async () => {
            if (quoteOpen) {
              setQuoteOpen(false);
              return;
            }
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


        {/* 3) 미니 캘린더 */}
        <MiniWeekCalendar
          weekStart={weekStart}
          todayId={todayId}
          loading={loadingMini}
          miniEntries={(miniEntries ?? []) as any}
          moodIconMap={MOOD_ICON}
          onGoCalendar={() =>
            navigation.navigate("CalendarTab", {
              screen: "Calendar",
            })
          }
          onGoDayDetail={(dateId) =>
            navigation.navigate("CalendarTab", {
              screen: "DayDetail",
              params: { date: dateId },
            })
          }
        />

        {/* 4) 최근 에너지 */}
        <EnergyCard
          loading={loading14}
          values={energy14Values}
          onGoReport={() => navigation.navigate("Report")}
        />

        {/* 5) 최근 나의 일기 */}
        <RecentDiaryCarousel
          loading={loading14}
          cards={recentCards}
          onGoMore={() => navigation.navigate("RecentDiaryList")}
          onGoDayDetail={(dateId) =>
            navigation.navigate("CalendarTab", {
              screen: "DayDetail",
              params: { date: dateId },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
