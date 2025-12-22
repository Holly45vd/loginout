// /workspaces/loginout/log-in-diary/src/screens/entry/EntryEditorScreen.tsx
import React, { useMemo, useState } from "react";
import { ScrollView, View, Pressable, Platform } from "react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button, Card, Divider, Text, TextInput } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { upsertDiary } from "../../data/firebase/diaryRepo";

import TopicPicker from "./components/TopicPicker";
import BatteryEnergyPicker from "./components/BatteryEnergyPicker";
import MoodGridPicker, { MoodKey } from "./components/MoodGridPicker";
import MoodScorePicker from "./components/MoodScorePicker";

/** ====== Const ====== */
const DEFAULT_TOPICS = [
  "일",
  "관계",
  "건강",
  "돈",
  "나",
  "가족",
  "공부",
  "취미",
] as const;

const EXTRA_TOPICS = ["휴식", "기타", "연애", "이직"] as const;

const ENERGY = [
  { key: "drained", label: "방전", score: 1 },
  { key: "low", label: "저전력", score: 2 },
  { key: "normal", label: "보통", score: 3 },
  { key: "charged", label: "충전됨", score: 4 },
  { key: "full", label: "풀충전", score: 5 },
] as const;

type EnergyKey = (typeof ENERGY)[number]["key"];

/** ====== Utils ====== */
function isFutureDate(yyyyMMdd: string, today: string) {
  return dayjs(yyyyMMdd).isAfter(dayjs(today), "day");
}

function clampToToday(yyyyMMdd: string, today: string) {
  return isFutureDate(yyyyMMdd, today) ? today : yyyyMMdd;
}

export default function EntryEditorScreen({ navigation, route }: any) {
  const { user } = useAuth();

  const todayId = dayjs().format("YYYY-MM-DD");
  const initialDate = route?.params?.date ?? todayId;

  const [date, setDate] = useState<string>(initialDate);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [topics, setTopics] = useState<string[]>([]);
  const [energyKey, setEnergyKey] = useState<EnergyKey | undefined>(undefined);

  const [mood, setMood] = useState<MoodKey | undefined>(undefined);
  const [moodScore, setMoodScore] = useState<number>(0); // 1~5, 0=미선택

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const energyObj = useMemo(
    () => ENERGY.find((e) => e.key === energyKey),
    [energyKey]
  );

  const futureBlocked = isFutureDate(date, todayId);
  const canSave = Boolean(user && energyObj && mood) && !saving && !futureBlocked;

  async function onSave() {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!energyObj || !mood) return;

    const safeDate = clampToToday(date, todayId);
    if (isFutureDate(safeDate, todayId)) {
      alert("오늘 이후 날짜에는 일기를 작성할 수 없습니다.");
      return;
    }

    const topicValue = topics[0] ?? "";
    const energyScore = energyObj.score;

    try {
      setSaving(true);

      await upsertDiary(user.uid, safeDate, {
        topic: topicValue,
        mood,
        energy: energyScore,
        score: energyScore, // 기존 로직 유지
        moodScore: moodScore ? moodScore : null, // ✅ 기분점수(선택 안하면 null)
        content: note ?? "",
      });

      navigation.goBack();
    } catch (e: any) {
      alert(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Text variant="headlineSmall" style={{ textAlign: "center", marginBottom: 12 }}>
        새 일기 작성
      </Text>

      {/* 날짜 */}
      <Text variant="titleMedium" style={{ marginBottom: 6 }}>
        날짜
      </Text>

      <Pressable onPress={() => setShowDatePicker(true)}>
        <View pointerEvents="none">
          <TextInput
            value={date}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            right={<TextInput.Icon icon="calendar" />}
            editable={false}
          />
        </View>
      </Pressable>

      {showDatePicker && (
        <DateTimePicker
          value={dayjs(date).toDate()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "calendar"}
          maximumDate={dayjs(todayId).toDate()} // ✅ 오늘까지만 선택
          onChange={(event, selected) => {
            // Android는 선택/취소 즉시 닫기
            if (Platform.OS !== "ios") setShowDatePicker(false);

            if (event.type === "dismissed" || !selected) return;

            const picked = dayjs(selected).format("YYYY-MM-DD");
            setDate(clampToToday(picked, todayId));

            // iOS도 선택 후 닫고 싶으면 주석 해제
            // if (Platform.OS === "ios") setShowDatePicker(false);
          }}
        />
      )}

      {futureBlocked && (
        <Text style={{ marginTop: 8, color: "#B00020" }}>
          오늘 이후 날짜에는 일기를 작성할 수 없습니다.
        </Text>
      )}

      <View style={{ height: 16 }} />

      {/* 오늘의 주제 */}
      <TopicPicker
        title="오늘의 주제"
        defaultTopics={DEFAULT_TOPICS}
        extraTopics={EXTRA_TOPICS}
        selectedTopics={topics}
        onChangeSelectedTopics={setTopics}
      />

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 에너지 */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        오늘의 에너지
      </Text>

      <BatteryEnergyPicker
        value={energyObj?.score ?? 0}
        onChange={(next) => {
          const picked = ENERGY.find((x) => x.score === next);
          setEnergyKey(picked?.key);
        }}
        labels
        size="lg"
        animated
      />

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 기분(9개, 3x3) */}
      <MoodGridPicker
        value={mood}
        onChange={(next) => {
          // ✅ 기분이 바뀌면 점수 초기화 (UX 꼬임 방지)
          setMood(next);
          setMoodScore(0);
        }}
      />

      {/* ✅ 기분을 선택해야만 기분점수 노출 */}
      {mood && (
        <>
          <View style={{ height: 18 }} />
          <Divider />
          <View style={{ height: 18 }} />

          <Text
            variant="titleMedium"
            style={{ marginBottom: 8, textAlign: "center" }}
          >
            기분 점수
          </Text>

          <MoodScorePicker value={moodScore} onChange={setMoodScore} />
        </>
      )}

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 오늘의 하루 */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        오늘의 하루
      </Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        mode="outlined"
        placeholder="한 줄만 써도 OK"
        multiline
        numberOfLines={5}
      />

      <View style={{ height: 18 }} />

      {/* 요약 */}
      <Card>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleMedium">요약</Text>
          <Text>날짜: {date}</Text>
          <Text>주제: {topics.length ? topics.join(", ") : "-"}</Text>
          <Text>에너지: {energyObj ? energyObj.label : "-"}</Text>
          <Text>기분: {mood ? mood : "-"}</Text>
          <Text>기분점수: {moodScore ? `${moodScore}/5` : "-"}</Text>
        </Card.Content>
      </Card>

      <View style={{ height: 16 }} />

      <Button mode="contained" onPress={onSave} disabled={!canSave} loading={saving}>
        저장
      </Button>
    </ScrollView>
  );
}
