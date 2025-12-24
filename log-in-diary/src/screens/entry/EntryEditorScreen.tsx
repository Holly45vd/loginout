import React, { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View, Pressable, Platform } from "react-native";
import dayjs from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";

import { Button, Card, Divider, Text, TextInput } from "react-native-paper";

import { useAuth } from "../../app/providers/AuthProvider";
import { getEntry, upsertDiary } from "../../data/firebase/diaryRepo";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import TopicPicker from "./components/TopicPicker";
import BatteryEnergyPicker from "./components/BatteryEnergyPicker";
import MoodGridPicker, { MoodKey } from "./components/MoodGridPicker";
import MoodScorePicker from "./components/MoodScorePicker";

/** ====== Const ====== */
const DEFAULT_TOPICS = ["일", "관계", "건강", "돈", "나", "가족", "공부", "취미"] as const;
const EXTRA_TOPICS = ["휴식", "기타", "연애", "이직"] as const;

function isFutureDate(yyyyMMdd: string, today: string) {
  return yyyyMMdd > today;
}

function clampToToday(yyyyMMdd: string, today: string) {
  return isFutureDate(yyyyMMdd, today) ? today : yyyyMMdd;
}

export default function EntryEditorScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const todayId = dayjs().format("YYYY-MM-DD");
  const initialDate = route?.params?.date ?? todayId;

  const [date, setDate] = useState<string>(clampToToday(initialDate, todayId));
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ✅ topic은 1개만 쓰는 구조(topics[0])라서 배열은 유지하되 단일 선택으로 운영
  const [topics, setTopics] = useState<string[]>([]);

  // ✅ BatteryEnergyPicker는 0~5 숫자를 기대 → 여기서도 숫자로 관리
  const [energyScore, setEnergyScore] = useState<number>(0); // 0=미선택, 1~5

  const [mood, setMood] = useState<MoodKey | undefined>(undefined);
  const [moodScore, setMoodScore] = useState<number>(0); // 1~5, 0=미선택

  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // route param(date) 변경 시 상태 동기화
  useEffect(() => {
    const next = route?.params?.date;
    if (next && typeof next === "string") {
      setDate(clampToToday(next, todayId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.params?.date]);

  // ====== 기존 일기 로드(수정/덮어쓰기) ======
  const enabledEntry = Boolean(user?.uid) && Boolean(date);
  const { data: existingEntry, isFetched: entryFetched } = useQuery({
    queryKey: ["entry", user?.uid, date],
    queryFn: () => getEntry(user!.uid, date),
    enabled: enabledEntry,
    staleTime: 0,
  });

  const lastHydratedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.uid) return;
    if (!date) return;
    if (!entryFetched) return;

    const hydrateKey = `${date}:${existingEntry ? "exists" : "none"}`;
    if (lastHydratedKeyRef.current === hydrateKey) return;

    const e: any = existingEntry;

    // topic
    setTopics(e?.topic ? [String(e.topic)] : []);

    // energy (Firestore 숫자 or 문자열 모두 방어)
    const en = typeof e?.energy === "number" ? e.energy : Number(e?.energy) || 0;
    setEnergyScore(Number.isFinite(en) ? Math.max(0, Math.min(5, en)) : 0);

    // mood
    setMood(e?.mood as MoodKey | undefined);

    // moodScore
    const ms = e?.moodScore ?? null;
    setMoodScore(typeof ms === "number" ? ms : 0);

    // content
    setNote(e?.content ? String(e.content) : "");

    lastHydratedKeyRef.current = hydrateKey;
  }, [date, existingEntry, entryFetched, user?.uid]);

  const futureBlocked = isFutureDate(date, todayId);
  const canSave =
    Boolean(user) &&
    energyScore >= 1 &&
    Boolean(mood) &&
    !saving &&
    !futureBlocked;

  async function onSave() {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (energyScore < 1 || !mood) {
      alert("에너지와 기분을 선택해줘.");
      return;
    }

    const safeDate = clampToToday(date, todayId);
    if (isFutureDate(safeDate, todayId)) {
      alert("오늘 이후 날짜에는 일기를 작성할 수 없습니다.");
      return;
    }

    const topicValue = topics[0] ?? "";

    try {
      setSaving(true);

      await upsertDiary(user.uid, safeDate, {
        topic: topicValue,
        mood,
        energy: energyScore,
        score: energyScore, // 기존 로직 유지
        moodScore: moodScore ? moodScore : null, // 선택 안하면 null
        content: note ?? "",
      });

      // 관련 화면 갱신
      const uid = user.uid;
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey as any[];
          if (!Array.isArray(key) || key.length < 2) return false;
          const k0 = String(key[0] ?? "");
          const k1 = key[1];
          if (k1 !== uid) return false;
          return (
            k0 === "entry" ||
            k0 === "entries" ||
            k0.startsWith("entriesRange") ||
            k0 === "reportRange"
          );
        },
      });

      navigation.goBack();
    } catch (e: any) {
      alert(e?.message ?? "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 140, gap: 14 }}>
      {/* 날짜 */}
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900" as any }}>날짜</Text>

          <Pressable onPress={() => setShowDatePicker(true)}>
            <View
              style={{
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 14,
                backgroundColor: "rgba(0,0,0,0.04)",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800" as any }}>
                {dayjs(date).format("YYYY.MM.DD")}
              </Text>
              {futureBlocked && (
                <Text style={{ marginTop: 4, color: "#D35400", fontWeight: "700" as any }}>
                  오늘 이후 날짜는 선택할 수 없습니다.
                </Text>
              )}
            </View>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={dayjs(date).toDate()}
              mode="date"
              display={Platform.select({ ios: "spinner", android: "default", web: "default" }) as any}
              maximumDate={dayjs(todayId).toDate()}
              onChange={(_, selectedDate) => {
                setShowDatePicker(false);
                if (!selectedDate) return;
                const next = dayjs(selectedDate).format("YYYY-MM-DD");
                setDate(clampToToday(next, todayId));
              }}
            />
          )}
        </Card.Content>
      </Card>

      {/* 주제 (✅ TopicPicker props 호환 버전으로 교체했으니 topics/onChange 그대로 사용 가능) */}
      <TopicPicker
        topics={topics}
        defaultTopics={[...DEFAULT_TOPICS]}
        extraTopics={[...EXTRA_TOPICS]}
        onChange={setTopics}
        multiple={false}          // ✅ 단일 선택
        addLabel="+추가"          // ✅ 버튼 텍스트
      />

      {/* 에너지 (✅ 숫자로 연결) */}
      <BatteryEnergyPicker value={energyScore} onChange={setEnergyScore} />

      {/* 기분 */}
      <MoodGridPicker value={mood} onChange={setMood} />

      {/* 기분 점수 */}
      <MoodScorePicker mood={mood} value={moodScore} onChange={setMoodScore} />

      {/* 오늘의 하루 */}
      <Card style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <Text style={{ fontWeight: "900" as any }}>오늘의 하루</Text>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={6}
            placeholder="오늘 하루를 적어줘."
            value={note}
            onChangeText={setNote}
            style={{ backgroundColor: "transparent" }}
          />
        </Card.Content>
      </Card>

      <Divider />

      <Button
        mode="contained"
        disabled={!canSave}
        loading={saving}
        onPress={onSave}
        contentStyle={{ height: 48 }}
        style={{ borderRadius: 16 }}
      >
        저장
      </Button>

      <Button mode="outlined" onPress={() => navigation.goBack()} style={{ borderRadius: 16 }}>
        취소
      </Button>
    </ScrollView>
  );
}
