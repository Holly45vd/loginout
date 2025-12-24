import React, { useMemo } from "react";
import { View, ScrollView, Image } from "react-native";
import { Button, Card, Divider, Text, Surface, IconButton } from "react-native-paper";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { useAuth } from "../../app/providers/AuthProvider";
import { getEntry } from "../../data/firebase/diaryRepo";
import { MOOD_IMAGE, DEFAULT_MOOD_IMAGE } from "../../assets/moodImages";

function toSafeDate(v: any): Date | null {
  if (!v) return null;
  try {
    if (typeof v?.toDate === "function") return v.toDate();
    if (v instanceof Date) return v;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function fmtDateTime(v: any) {
  const d = toSafeDate(v);
  if (!d) return "-";
  return dayjs(d).format("YYYY.MM.DD HH:mm");
}

function energyLabel(score?: number) {
  if (!score) return "-";
  return ["", "방전", "저전력", "보통", "충전됨", "풀충전"][score] ?? String(score);
}

function moodKo(key?: string) {
  const map: Record<string, string> = {
    anxiety: "불안",
    coldness: "냉담",
    lethargy: "무기력",
    lonely: "외로움",
    calm: "평온",
    sadness: "슬픔",
    happiness: "행복",
    hope: "희망",
    growth: "성장",
    confident: "자신감",
  };
  return key ? map[key] ?? key : "-";
}

export default function DayDetailScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const date = route?.params?.date as string;

  const { data, isLoading } = useQuery({
    queryKey: ["entry", user?.uid, date],
    queryFn: () => getEntry(user!.uid, date),
    enabled: Boolean(user?.uid && date),
  });

  const hasData = Boolean(data);

  const moodImg = useMemo(() => {
    if (!data?.mood) return DEFAULT_MOOD_IMAGE;
    return (MOOD_IMAGE as any)[data.mood] ?? DEFAULT_MOOD_IMAGE;
  }, [data?.mood]);

  const heroImgSource = useMemo(() => {
    if (!hasData) return (moodImg as any).normal ?? DEFAULT_MOOD_IMAGE;
    return (moodImg as any).active ?? (moodImg as any).normal ?? DEFAULT_MOOD_IMAGE;
  }, [hasData, moodImg]);

  const topic = data?.topic || "-";
  const energyScore = data?.energy ?? null;
  const mood = data?.mood || null;
  const moodScore = data?.moodScore ?? null;
  const content = data?.content || "";

  const createdAt = fmtDateTime(data?.createdAt);
  const updatedAt = fmtDateTime(data?.updatedAt);

  // ✅ 수정은 WriteTab(WriteStack)의 WriteHome(=EntryEditor)로 이동
const goEdit = () => {
  navigation.navigate("Main", {
    screen: "WriteTab",
    params: { date },
  });
};


  if (!user) {
    return (
      <View style={{ padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={{ padding: 16 }}>
        <Text>불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 14 }}>
      <Card style={{ borderRadius: 22, overflow: "hidden" }}>
        <Card.Content style={{ paddingVertical: 18, gap: 10, minHeight: 160 }}>
          <View style={{ position: "absolute", top: 10, right: 10, zIndex: 5 }}>
            <Surface
              elevation={1}
              style={{ borderRadius: 999, backgroundColor: "rgba(255,255,255,0.95)" }}
            >
              <IconButton icon={hasData ? "pencil" : "plus"} size={20} onPress={goEdit} />
            </Surface>
          </View>

          <Text style={{ opacity: 0.7 }}>
            {dayjs(date).format("YYYY.MM.DD")} (
            {["일", "월", "화", "수", "목", "금", "토"][dayjs(date).day()]})
          </Text>

          <Text variant="headlineSmall" style={{ fontWeight: "900" as any, letterSpacing: -0.2 }} numberOfLines={2}>
            기분 · {mood ? moodKo(mood) : "-"}
          </Text>

          <Text style={{ opacity: 0.75 }}>
            {topic}
            {moodScore ? ` · 점수 ${moodScore}/5` : ""}
          </Text>

          <Image
            source={heroImgSource}
            resizeMode="contain"
            style={{
              position: "absolute",
              right: -10,
              bottom: -18,
              width: 190,
              height: 190,
              opacity: 0.28,
              transform: [{ rotate: "-8deg" }],
            }}
          />

          {!hasData && (
            <Button
              mode="contained"
              onPress={goEdit}
              contentStyle={{ height: 46 }}
              style={{ marginTop: 10, borderRadius: 14 }}
            >
              기록하기
            </Button>
          )}
        </Card.Content>
      </Card>

      <Card style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 14 }}>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Surface elevation={0} style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: "rgba(0,0,0,0.03)" }}>
              <Text style={{ opacity: 0.6 }}>에너지</Text>
              <Text style={{ fontSize: 16, fontWeight: "800" as any }}>{energyLabel(energyScore ?? undefined)}</Text>
            </Surface>

            <Surface elevation={0} style={{ flex: 1, borderRadius: 16, padding: 12, backgroundColor: "rgba(0,0,0,0.03)" }}>
              <Text style={{ opacity: 0.6 }}>기분 점수</Text>
              <Text style={{ fontSize: 16, fontWeight: "800" as any }}>{moodScore ? `${moodScore}/5` : "-"}</Text>
            </Surface>
          </View>

          <Divider />

          <Text style={{ lineHeight: 20, opacity: 0.9 }}>
            {content?.trim() ? content : "(내용 없음)"}
          </Text>
        </Card.Content>
      </Card>

      <Card style={{ borderRadius: 22 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ opacity: 0.6 }}>등록 날짜</Text>
            <Text style={{ fontWeight: "700" as any }}>{createdAt}</Text>

            <Text style={{ opacity: 0.6, marginTop: 8 }}>수정 날짜</Text>
            <Text style={{ fontWeight: "700" as any }}>{updatedAt}</Text>
          </View>
        </Card.Content>
      </Card>

      <Button mode="outlined" onPress={() => navigation.goBack()} style={{ borderRadius: 14 }}>
        뒤로
      </Button>
    </ScrollView>
  );
}
