import React, { useMemo, useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import dayjs from "dayjs";

import {
  Button,
  Card,
  Chip,
  Divider,
  Text,
  TextInput,
  SegmentedButtons,
  Surface,
} from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { upsertDiary } from "../../data/firebase/diaryRepo";

type MoodKey =
  | "anxiety"
  | "coldness"
  | "lethargy"
  | "lonely"
  | "calm"
  | "sadness"
  | "happiness"
  | "hope"
  | "growth"
  | "confident";

const DEFAULT_TOPICS = ["일", "관계", "건강", "돈", "나", "가족", "공부", "취미"] as const;
const EXTRA_TOPICS = ["휴식", "기타", "연애", "이직"] as const;

const ENERGY = [
  { key: "drained", label: "방전", score: 1 },
  { key: "low", label: "저전력", score: 2 },
  { key: "normal", label: "보통", score: 3 },
  { key: "charged", label: "충전됨", score: 4 },
  { key: "full", label: "풀충전", score: 5 },
] as const;

const MOODS: Array<{
  key: MoodKey;
  icon: string;
  en: string;
  ko: string;
}> = [
  { key: "anxiety", icon: "🌩️", en: "Anxiety", ko: "불안" },
  { key: "coldness", icon: "☁️", en: "Coldness", ko: "냉담" },
  { key: "lethargy", icon: "🌧️", en: "Lethargy", ko: "무기력" },
  { key: "lonely", icon: "🌙", en: "Lonely", ko: "외로움" },
  { key: "calm", icon: "🌤️", en: "Calm", ko: "평온" },
  { key: "sadness", icon: "🌫️", en: "Sadness", ko: "슬픔" },
  { key: "happiness", icon: "☀️", en: "Happiness", ko: "행복" },
  { key: "hope", icon: "🌈", en: "Hope", ko: "희망" },
  { key: "growth", icon: "🌱", en: "Growth", ko: "성장" },
  { key: "confident", icon: "🔥", en: "Confident", ko: "자신감" },
];

function toggleArr(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function EntryEditorScreen({ navigation, route }: any) {
  // ✅ Hook은 반드시 컴포넌트 안에서!
  const { user } = useAuth();

  const initialDate = route?.params?.date ?? dayjs().format("YYYY-MM-DD");

  const [date, setDate] = useState<string>(initialDate);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [energy, setEnergy] = useState<string | undefined>(undefined);
  const [mood, setMood] = useState<MoodKey | undefined>(undefined);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const topicCandidates = useMemo(
    () => [...DEFAULT_TOPICS, ...EXTRA_TOPICS],
    []
  );

  const canSave = Boolean(user && energy && mood) && !saving;

  const selectedMood = useMemo(
    () => MOODS.find((m) => m.key === mood),
    [mood]
  );

  const energyObj = useMemo(
    () => ENERGY.find((e) => e.key === energy),
    [energy]
  );

  async function onSave() {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!energyObj || !mood) return;

    const topicValue = topics[0] ?? ""; // 스샷 구조(topic: string) 유지
    const energyScore = energyObj.score;

    try {
      setSaving(true);

await upsertDiary(user.uid, date, {
  topic: topicValue,
  mood,
  energy: energyScore,
  score: energyScore,
  content: note ?? "",
});

      navigation.goBack();
    } catch (e: any) {
      alert(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  function addCustomTopic() {
    const v = topicInput.trim();
    if (!v) return;
    setTopics((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTopicInput("");
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
      <TextInput
        value={date}
        onChangeText={setDate}
        mode="outlined"
        placeholder="YYYY-MM-DD"
        right={<TextInput.Icon icon="calendar" />}
      />

      <View style={{ height: 16 }} />

      {/* 오늘의 주제 */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        오늘의 주제
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {topicCandidates.map((t) => {
          const selected = topics.includes(t);
          return (
            <Chip
              key={t}
              selected={selected}
              onPress={() => setTopics((prev) => toggleArr(prev, t))}
              mode="outlined"
            >
              {t}
            </Chip>
          );
        })}
      </View>

      <View style={{ height: 10 }} />

      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput
          value={topicInput}
          onChangeText={setTopicInput}
          mode="outlined"
          placeholder="주제 추가"
          style={{ flex: 1 }}
          onSubmitEditing={addCustomTopic}
          returnKeyType="done"
        />
        <Button mode="contained" onPress={addCustomTopic}>
          추가
        </Button>
      </View>

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 에너지 */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        오늘의 에너지
      </Text>
      <SegmentedButtons
        value={energy}
        onValueChange={setEnergy}
        buttons={ENERGY.map((e) => ({ value: e.key, label: e.label }))}
      />

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 기분 */}
      <Text variant="titleMedium" style={{ marginBottom: 8, textAlign: "center" }}>
        오늘의 기분
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        {MOODS.map((m) => {
          const selected = mood === m.key;

          return (
            <Pressable key={m.key} onPress={() => setMood(m.key)} style={{ width: "45%" }}>
              <Surface
                elevation={selected ? 3 : 0}
                style={{
                  borderRadius: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderColor: selected ? "rgba(60,60,120,0.6)" : "rgba(0,0,0,0.12)",
                  backgroundColor: selected ? "rgba(60,60,120,0.06)" : "white",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 34 }}>{m.icon}</Text>
                <Text variant="titleSmall">{m.en}</Text>
                <Text variant="bodySmall" style={{ opacity: 0.7 }}>
                  {m.ko}
                </Text>
              </Surface>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: 18 }} />
      <Divider />
      <View style={{ height: 18 }} />

      {/* 텍스트 */}
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

      <Card>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleMedium">요약</Text>
          <Text>날짜: {date}</Text>
          <Text>주제: {topics.length ? topics.join(", ") : "-"}</Text>
          <Text>에너지: {energyObj ? energyObj.label : "-"}</Text>
          <Text>기분: {selectedMood ? `${selectedMood.en} (${selectedMood.ko})` : "-"}</Text>
        </Card.Content>
      </Card>

      <View style={{ height: 16 }} />

      <Button mode="contained" onPress={onSave} disabled={!canSave} loading={saving}>
        저장
      </Button>
    </ScrollView>
  );
}
