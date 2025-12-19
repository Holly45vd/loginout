import React, { useEffect, useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import {
  Button,
  Card,
  Text,
  Chip,
  Divider,
  Switch,
  List,
  SegmentedButtons,
} from "react-native-paper";
import dayjs from "dayjs";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { useAuth } from "../../app/providers/AuthProvider";
import { logout } from "../../data/firebase/auth";
import { db } from "../../data/firebase/firebase";

// ======= 설정 키(로컬 저장) =======
const STORAGE_KEYS = {
  quoteEnabled: "settings:quoteEnabled",
  defaultStart: "settings:defaultStart", // "Home" | "Calendar"
  reminderEnabled: "settings:reminderEnabled",
  reminderTime: "settings:reminderTime", // "21:00"
  proEnabled: "settings:proEnabled", // 임시: 결제 붙이기 전 상태값
} as const;

// ======= mood/energy 매핑 (리포트/에디터와 동일 키) =======
const MOOD_LABEL: Record<string, string> = {
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

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp1to5(n: number) {
  return Math.max(1, Math.min(5, n));
}

function trendFromValues(values: number[]) {
  const valid = values.filter((v) => v > 0);
  if (valid.length < 4) return "유지" as const;

  const third = Math.max(1, Math.floor(valid.length / 3));
  const head = valid.slice(0, third);
  const tail = valid.slice(-third);
  const diff = avg(tail) - avg(head);

  if (diff > 0.4) return "상승" as const;
  if (diff < -0.4) return "하락" as const;
  return "유지" as const;
}

function coachOneLiner(opts: { avgEnergy: number; trend: "상승" | "하락" | "유지"; writtenDays: number }) {
  const { avgEnergy, trend, writtenDays } = opts;
  if (writtenDays === 0) return "오늘 1줄만 남기면, 내일부터는 흐름이 보이기 시작해.";
  if (avgEnergy <= 2.3) return `지금은 “회복” 페이스(${trend}). 쉬운 일 1개만 하고 자책은 금지.`;
  if (avgEnergy <= 3.4) return `지금은 “유지” 페이스(${trend}). 루틴 1개만 지키면 승리야.`;
  return `지금은 “확장” 페이스(${trend}). 중요한 일 1개에만 화력 집중해.`;
}

// streak 계산: dateSet 기준으로 (1) 현재 streak (오늘부터 거꾸로) (2) 최고 streak
function calcStreaks(dates: string[]) {
  const set = new Set(dates);
  const today = dayjs().format("YYYY-MM-DD");

  // current streak (오늘부터)
  let cur = 0;
  for (let i = 0; ; i++) {
    const d = dayjs(today).subtract(i, "day").format("YYYY-MM-DD");
    if (!set.has(d)) break;
    cur++;
  }

  // best streak (정렬된 날짜 기반)
  const sorted = [...set].sort((a, b) => (a < b ? -1 : 1));
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = dayjs(sorted[i - 1]);
      const now = dayjs(sorted[i]);
      run = now.diff(prev, "day") === 1 ? run + 1 : 1;
    }
    best = Math.max(best, run);
  }

  return { current: cur, best };
}

// ======= Firestore: users/{uid}/entries =======
async function fetchAllTimeCount(uid: string) {
  const colRef = collection(db, "users", uid, "entries");
  const snap = await getCountFromServer(colRef);
  return snap.data().count ?? 0;
}

async function fetchLastEntry(uid: string) {
  const colRef = collection(db, "users", uid, "entries");
  const q = query(colRef, orderBy("date", "desc"), limit(1));
  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  return doc0 ? ({ id: doc0.id, ...(doc0.data() as any) } as any) : null;
}

async function fetchEntriesByRange(uid: string, start: string, end: string) {
  const colRef = collection(db, "users", uid, "entries");
  const q = query(colRef, where("date", ">=", start), where("date", "<=", end), orderBy("date", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
}

// 요일(0~6) 평균 에너지
function bestDowByAvg(entries: any[]) {
  const map: Record<number, { sum: number; cnt: number }> = {};
  for (const e of entries) {
    const energy = e?.energy ? clamp1to5(Number(e.energy)) : 0;
    if (!energy) continue;
    const dow = dayjs(e.date).day(); // 0 Sun
    map[dow] = map[dow] ?? { sum: 0, cnt: 0 };
    map[dow].sum += energy;
    map[dow].cnt += 1;
  }
  const rows = Object.entries(map).map(([k, v]) => ({ dow: Number(k), avg: v.sum / v.cnt, n: v.cnt }));
  rows.sort((a, b) => b.avg - a.avg);
  return rows[0] ?? null;
}

function dowLabel(dow: number) {
  // dayjs: 0=Sun
  const labels = ["일", "월", "화", "수", "목", "금", "토"];
  return labels[dow] ?? "-";
}

// mood top1
function topMood(entries: any[]) {
  const c: Record<string, number> = {};
  for (const e of entries) {
    if (!e?.mood) continue;
    c[e.mood] = (c[e.mood] ?? 0) + 1;
  }
  const rows = Object.entries(c).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (!rows.length) return null;
  return { mood: rows[0][0], count: rows[0][1] as number };
}

// topic avg energy best / worst
function topicAvgEnergy(entries: any[]) {
  const m: Record<string, { sum: number; cnt: number }> = {};
  for (const e of entries) {
    const topic = (e?.topic ?? "").trim();
    const energy = e?.energy ? clamp1to5(Number(e.energy)) : 0;
    if (!topic || !energy) continue;
    m[topic] = m[topic] ?? { sum: 0, cnt: 0 };
    m[topic].sum += energy;
    m[topic].cnt += 1;
  }
  const rows = Object.entries(m)
    .filter(([, v]) => v.cnt >= 2)
    .map(([k, v]) => ({ topic: k, avg: v.sum / v.cnt, n: v.cnt }))
    .sort((a, b) => b.avg - a.avg);

  return {
    best: rows[0] ?? null,
    worst: rows.length >= 2 ? rows[rows.length - 1] : null,
  };
}

// mood ↔ energy 간이상관 느낌(평균 비교)
function moodEnergyMiniInsight(entries: any[], overallAvg: number) {
  const m: Record<string, { sum: number; cnt: number }> = {};
  for (const e of entries) {
    const mood = e?.mood;
    const energy = e?.energy ? clamp1to5(Number(e.energy)) : 0;
    if (!mood || !energy) continue;
    m[mood] = m[mood] ?? { sum: 0, cnt: 0 };
    m[mood].sum += energy;
    m[mood].cnt += 1;
  }
  const rows = Object.entries(m)
    .filter(([, v]) => v.cnt >= 2)
    .map(([k, v]) => ({ mood: k, avg: v.sum / v.cnt, n: v.cnt }))
    .sort((a, b) => b.avg - a.avg);

  if (rows.length < 2 || overallAvg === 0) {
    return "기분↔에너지 패턴은 표본이 더 필요해. (같은 기분이 2번 이상 쌓이면 정확도가 확 올라가.)";
  }

  const top = rows[0];
  const bottom = rows[rows.length - 1];

  const topDiff = top.avg - overallAvg;
  const bottomDiff = overallAvg - bottom.avg;

  const hint =
    topDiff >= 0.6
      ? "이 기분이 뜨는 날엔 중요한 일 1개로 ‘확장’해도 좋아."
      : bottomDiff >= 0.6
      ? "이 기분이 오면 목표를 ‘회복’으로 바꾸자. 루틴 1개만 지켜도 충분해."
      : "기분별 차이가 크진 않아. 꾸준함이 승부처야.";

  return `간이분석: ${MOOD_ICON[top.mood] ?? "🙂"} ${MOOD_LABEL[top.mood] ?? top.mood}일 때 평균 ${
    top.avg.toFixed(1)
  }/5 (n=${top.n}), ${
    MOOD_ICON[bottom.mood] ?? "🙂"
  } ${MOOD_LABEL[bottom.mood] ?? bottom.mood}일 때 ${
    bottom.avg.toFixed(1)
  }/5 (n=${bottom.n}). 코치의 힌트: ${hint}`;
}

export default function ProfileScreen({ navigation }: any) {
  const { user } = useAuth();

  // ======= Settings (local) =======
  const [quoteEnabled, setQuoteEnabled] = useState(true);
  const [defaultStart, setDefaultStart] = useState<"Home" | "Calendar">("Home");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("21:00");
  const [proEnabled, setProEnabled] = useState(false);

  // ======= Stats (firestore) =======
  const [loading, setLoading] = useState(false);
  const [allCount, setAllCount] = useState<number>(0);
  const [lastEntry, setLastEntry] = useState<any>(null);

  // 최근 90일 표본으로 “나의 스타일” 계산 (비용/속도 균형)
  const sampleDays = 90;
  const sampleEnd = dayjs().format("YYYY-MM-DD");
  const sampleStart = dayjs().subtract(sampleDays - 1, "day").format("YYYY-MM-DD");

  const [sampleEntries, setSampleEntries] = useState<any[]>([]);

  // ======= Load settings =======
  useEffect(() => {
    (async () => {
      try {
        const [
          q,
          d,
          r,
          t,
          p,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.quoteEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.defaultStart),
          AsyncStorage.getItem(STORAGE_KEYS.reminderEnabled),
          AsyncStorage.getItem(STORAGE_KEYS.reminderTime),
          AsyncStorage.getItem(STORAGE_KEYS.proEnabled),
        ]);

        if (q != null) setQuoteEnabled(q !== "false");
        if (d === "Calendar" || d === "Home") setDefaultStart(d);
        if (r != null) setReminderEnabled(r === "true");
        if (t) setReminderTime(t);
        if (p != null) setProEnabled(p === "true");
      } catch {
        // ignore
      }
    })();
  }, []);

  // ======= Save settings =======
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.quoteEnabled, String(quoteEnabled)).catch(() => {});
  }, [quoteEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.defaultStart, defaultStart).catch(() => {});
  }, [defaultStart]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.reminderEnabled, String(reminderEnabled)).catch(() => {});
  }, [reminderEnabled]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.reminderTime, reminderTime).catch(() => {});
  }, [reminderTime]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.proEnabled, String(proEnabled)).catch(() => {});
  }, [proEnabled]);

  // ======= Load stats =======
  useEffect(() => {
    if (!user?.uid) return;

    (async () => {
      try {
        setLoading(true);
        const [cnt, last, sample] = await Promise.all([
          fetchAllTimeCount(user.uid),
          fetchLastEntry(user.uid),
          fetchEntriesByRange(user.uid, sampleStart, sampleEnd),
        ]);

        setAllCount(cnt);
        setLastEntry(last);
        setSampleEntries(sample);
      } catch (e: any) {
        alert(e?.message ?? "프로필 데이터 로드 실패");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid, sampleStart, sampleEnd]);

  const derived = useMemo(() => {
    const entries = sampleEntries ?? [];

    const dates = entries.map((e) => e.date).filter(Boolean);
    const { current, best } = calcStreaks(dates);

    // 평균/트렌드
    const energyValues = entries
      .map((e) => (e?.energy ? clamp1to5(Number(e.energy)) : 0))
      .filter((v) => v > 0);

    const avgEnergy = avg(energyValues);
    const trend = trendFromValues(
      // 날짜 순서 기반으로 보고 싶으니, 정렬 후 에너지 배열 구성
      entries
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((e) => (e?.energy ? clamp1to5(Number(e.energy)) : 0))
    );

    const topM = topMood(entries);
    const bestDow = bestDowByAvg(entries);
    const topicAE = topicAvgEnergy(entries);

    const coachLine = coachOneLiner({ avgEnergy, trend, writtenDays: energyValues.length });

    const moodEnergyLine = moodEnergyMiniInsight(entries, avgEnergy);

    const topicCoachLine = (() => {
      if (!topicAE.best && !topicAE.worst) return "주제별 에너지 코칭은 표본이 더 필요해. (같은 주제가 2번 이상 쌓이면 더 정확해져.)";
      const parts: string[] = [];
      if (topicAE.best) {
        parts.push(`"${topicAE.best.topic}"은(는) 너를 살리는 주제 쪽이야(평균 ${topicAE.best.avg.toFixed(1)}/5, n=${topicAE.best.n}).`);
      }
      if (topicAE.worst && topicAE.best?.topic !== topicAE.worst.topic) {
        parts.push(`"${topicAE.worst.topic}"은(는) 에너지를 깎는 편이야(평균 ${topicAE.worst.avg.toFixed(1)}/5, n=${topicAE.worst.n}).`);
      }
      parts.push("코치의 한마디: 살리는 주제는 10분이라도 확보하고, 깎는 주제는 ‘작게 쪼개서’ 처리하자.");
      return parts.join(" ");
    })();

    // “나의 스타일” 요약 3줄
    const styleLines: string[] = [];
    if (topM) styleLines.push(`자주 나오는 기분: ${MOOD_ICON[topM.mood] ?? "🙂"} ${MOOD_LABEL[topM.mood] ?? topM.mood} (${topM.count}회, 최근 ${sampleDays}일 기준)`);
    else styleLines.push("자주 나오는 기분: 데이터가 더 필요해.");

    if (bestDow) styleLines.push(`에너지가 높은 요일: ${dowLabel(bestDow.dow)}요일 (평균 ${bestDow.avg.toFixed(1)}/5, n=${bestDow.n})`);
    else styleLines.push("에너지가 높은 요일: 데이터가 더 필요해.");

    if (topicAE.best) styleLines.push(`에너지를 살리는 주제: "${topicAE.best.topic}" (평균 ${topicAE.best.avg.toFixed(1)}/5)`);
    else styleLines.push("에너지를 살리는 주제: 데이터가 더 필요해.");

    const creationTime = user?.metadata?.creationTime ? dayjs(user.metadata.creationTime).format("YYYY.MM.DD") : "-";

    return {
      creationTime,
      sampleDays,
      sampleStart,
      sampleEnd,
      currentStreak: current,
      bestStreak: best,
      avgEnergy,
      trend,
      coachLine,
      styleLines,
      moodEnergyLine,
      topicCoachLine,
    };
  }, [sampleEntries, user, sampleDays, sampleStart, sampleEnd]);

  async function onLogout() {
    try {
      await logout();
    } catch (e: any) {
      alert(e?.message ?? "로그아웃 실패");
    }
  }

  if (!user) {
    return (
      <View style={{ flex: 1, padding: 16 }}>
        <Text variant="headlineMedium">내 정보</Text>
        <Text style={{ marginTop: 10 }}>로그인이 필요합니다.</Text>
      </View>
    );
  }

  const lastDateText = lastEntry?.date ? dayjs(lastEntry.date).format("YYYY.MM.DD") : "-";

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}>
      <Text variant="headlineMedium">내 정보</Text>

      {/* 1) 계정 정보 */}
      <Card>
        <Card.Content style={{ gap: 6 }}>
          <Text variant="titleMedium">계정</Text>
          <Text>상태: 로그인됨</Text>
          <Text>이메일: {user.email ?? "-"}</Text>
          <Text>이름: {user.displayName ?? "-"}</Text>
          <Text>가입일: {derived.creationTime}</Text>
        </Card.Content>
      </Card>

      {/* 2) 나의 기록 요약 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">나의 기록 요약</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip>총 기록 {loading ? "…" : allCount}일</Chip>
            <Chip>최근 기록 {lastDateText}</Chip>
            <Chip>현재 연속 {derived.currentStreak}일</Chip>
            <Chip>최대 연속 {derived.bestStreak}일</Chip>
          </View>

          <Text style={{ opacity: 0.6 }}>
            * 스타일 분석은 최근 {derived.sampleDays}일({dayjs(derived.sampleStart).format("MM/DD")}~{dayjs(derived.sampleEnd).format("MM/DD")}) 표본 기준
          </Text>
        </Card.Content>
      </Card>

      {/* 3) AI 코치 한 줄 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">AI 코치 한마디</Text>
          <Text style={{ lineHeight: 20 }}>{derived.coachLine}</Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip>평균 {derived.avgEnergy ? derived.avgEnergy.toFixed(1) : "-"} / 5</Chip>
            <Chip>페이스 {derived.trend}</Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 4) 나의 기록 스타일 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">나의 기록 스타일</Text>
          {derived.styleLines.map((line, idx) => (
            <Text key={idx} style={{ lineHeight: 20 }}>
              • {line}
            </Text>
          ))}
        </Card.Content>
      </Card>

      {/* 5) 코치형 분석(간이상관/주제별 평균 에너지) */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">코치형 분석</Text>

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "600" as any }}>기분 ↔ 에너지</Text>
            <Text style={{ lineHeight: 20 }}>{derived.moodEnergyLine}</Text>
          </View>

          <Divider />

          <View style={{ gap: 6 }}>
            <Text style={{ fontWeight: "600" as any }}>주제별 평균 에너지</Text>
            <Text style={{ lineHeight: 20 }}>{derived.topicCoachLine}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* 6) 설정 */}
      <Card>
        <Card.Content style={{ gap: 10 }}>
          <Text variant="titleMedium">설정</Text>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text>홈 명언 표시</Text>
            <Switch value={quoteEnabled} onValueChange={setQuoteEnabled} />
          </View>

          <Text style={{ marginTop: 4, opacity: 0.7 }}>첫 화면</Text>
          <SegmentedButtons
            value={defaultStart}
            onValueChange={(v) => setDefaultStart(v as "Home" | "Calendar")}
            buttons={[
              { value: "Home", label: "Home" },
              { value: "Calendar", label: "Calendar" },
            ]}
          />

          <Divider style={{ marginVertical: 6 }} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text>기록 리마인더</Text>
            <Switch value={reminderEnabled} onValueChange={setReminderEnabled} />
          </View>

          <Text style={{ opacity: 0.6 }}>
            * 알림 스케줄(푸시)은 다음 단계에서 연결. 지금은 설정 저장만 합니다.
          </Text>

          <List.Item
            title="리마인더 시간"
            description={reminderTime}
            right={(props) => <List.Icon {...props} icon="clock-outline" />}
            onPress={() => {
              // 간단 버전: 토글 형태로만. 시간 선택 UI는 다음 단계에서 DateTimePicker로 연결 추천.
              setReminderTime((prev) => (prev === "21:00" ? "22:00" : prev === "22:00" ? "23:00" : "21:00"));
            }}
          />
        </Card.Content>
      </Card>

      {/* 7) 데이터 관리 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">데이터 관리</Text>
          <Text style={{ opacity: 0.7 }}>
            당신의 기록은 당신만 볼 수 있어. (Firestore rules 기준)
          </Text>

          <Button
            mode="outlined"
            onPress={() => navigation?.navigate?.("DataManage")}
          >
            데이터 내보내기 / 삭제
          </Button>

          <Text style={{ opacity: 0.6 }}>
            * 아직 DataManageScreen이 없으면, 다음 단계에서 화면을 같이 만들면 됨.
          </Text>
        </Card.Content>
      </Card>

      {/* 8) 플랜 (수익화 자리) */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">플랜</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <Chip>플랜: {proEnabled ? "PRO" : "무료"}</Chip>
            <Chip>리포트: {proEnabled ? "7/30/90일" : "7일"}</Chip>
            <Chip>광고: {proEnabled ? "제거" : "표시"}</Chip>
          </View>

          <Button
            mode="contained"
            onPress={() => setProEnabled((v) => !v)}
          >
            {proEnabled ? "PRO 해제(임시)" : "PRO 체험(임시)"}
          </Button>

          <Text style={{ opacity: 0.6 }}>
            * 결제 붙이기 전이라 “임시 토글”로 UI 흐름만 잡아둠.
          </Text>
        </Card.Content>
      </Card>

      {/* 9) 로그아웃 */}
      <Button mode="contained" onPress={onLogout}>
        로그아웃
      </Button>
    </ScrollView>
  );
}
