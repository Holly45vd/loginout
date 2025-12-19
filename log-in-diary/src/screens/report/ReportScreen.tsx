import React, { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Card, Text, SegmentedButtons, Chip, Divider } from "react-native-paper";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts";

import { useAuth } from "../../app/providers/AuthProvider";
import { listEntriesByRange } from "../../data/firebase/diaryRepo";

type PeriodValue = "7" | "30" | "90";

const PERIODS: Array<{ value: PeriodValue; label: string }> = [
  { value: "7", label: "7일" },
  { value: "30", label: "30일" },
  { value: "90", label: "90일" },
];

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

const clamp1to5 = (n: number) => Math.max(1, Math.min(5, n));

function toTopN(obj: Record<string, number>, n: number) {
  return Object.entries(obj)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, n);
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function trendFromSeries(values: number[]) {
  // 초반 1/3 vs 후반 1/3 비교 (0 제외)
  const valid = values.filter((v) => v > 0);
  if (valid.length < 3) return "유지" as const;

  const third = Math.max(1, Math.floor(valid.length / 3));
  const head = valid.slice(0, third);
  const tail = valid.slice(-third);
  const headAvg = avg(head);
  const tailAvg = avg(tail);
  const diff = tailAvg - headAvg;

  if (diff > 0.4) return "상승" as const;
  if (diff < -0.4) return "하락" as const;
  return "유지" as const;
}

function coachSummary(opts: {
  days: number;
  writtenDays: number;
  avgEnergy: number;
  trend: "상승" | "하락" | "유지";
  moodTop?: { key: string; count: number };
  topicTop?: { key: string; count: number };
}) {
  const { days, writtenDays, avgEnergy, trend, moodTop, topicTop } = opts;

  const line1 =
    writtenDays === 0
      ? `최근 ${days}일은 아직 기록이 비어 있어. 오늘 1줄만 남기면 흐름이 바로 잡힌다.`
      : `최근 ${days}일 중 ${writtenDays}일 기록했어. 평균 에너지는 ${avgEnergy.toFixed(
          1
        )}/5, 흐름은 "${trend}" 쪽이야.`;

  const line2 = moodTop
    ? `가장 자주 나온 기분은 ${MOOD_ICON[moodTop.key] ?? "🙂"} ${
        MOOD_LABEL[moodTop.key] ?? moodTop.key
      } (${moodTop.count}회). 이 감정이 요즘 너의 배경음악이네.`
    : `기분 데이터가 아직 적어. 기분만 꾸준히 찍어도 패턴이 선명해져.`;

  const line3 = topicTop
    ? `주제는 "${topicTop.key}"이(가) ${topicTop.count}회로 1위야. 여기가 지금 에너지에 영향을 주는 핵심 구간일 가능성이 커.`
    : `주제 선택이 적어. 주제 1개만 골라도 리포트가 더 정확해져.`;

  let action = "오늘은 5분만 정리하고, 나머지는 내일의 나한테 맡겨.";
  if (writtenDays > 0) {
    if (avgEnergy <= 2.3) action = "오늘은 ‘회복’이 목표. 제일 쉬운 일 1개만 끝내자.";
    else if (avgEnergy <= 3.4) action = "오늘은 ‘유지’가 목표. 루틴 1개만 지키면 승리야.";
    else action = "오늘은 ‘확장’하기 좋은 날. 중요한 일 1개에만 화력 집중해.";
  }

  return [line1, line2, line3, `코치의 한마디: ${action}`];
}

function bestWorstAdvice(best?: any, worst?: any) {
  const lines: string[] = [];

  if (best) {
    const m = best.mood ? `${MOOD_ICON[best.mood] ?? "🙂"} ${MOOD_LABEL[best.mood] ?? best.mood}` : "🙂";
    const t = best.topic ? `주제 "${best.topic}"` : "주제 미기록";
    // 높은 에너지일 때: "확장" 조언
    lines.push(
      `최고의 날(${dayjs(best.date).format("MM/DD")} · ${m} · ${t}): 그날처럼 “딱 1개”에 집중하면 성과가 커져. 중요한 일부터 잡자.`
    );
  } else {
    lines.push("최고의 날: 데이터가 더 쌓이면 ‘잘 풀리는 패턴’을 더 정확히 잡아줄게.");
  }

  if (worst) {
    const m = worst.mood ? `${MOOD_ICON[worst.mood] ?? "🙂"} ${MOOD_LABEL[worst.mood] ?? worst.mood}` : "🙂";
    const t = worst.topic ? `주제 "${worst.topic}"` : "주제 미기록";
    // 낮은 에너지일 때: "회복" 조언
    lines.push(
      `최저의 날(${dayjs(worst.date).format("MM/DD")} · ${m} · ${t}): 그날의 목표는 “버티기”였어. 다음엔 ‘제일 쉬운 일 1개’만 하고 자책은 금지.`
    );
  } else {
    lines.push("최저의 날: 데이터가 더 쌓이면 ‘에너지가 떨어지는 트리거’를 더 정확히 잡아줄게.");
  }

  return lines;
}

function moodEnergyInsight(moodStats: Record<string, { sum: number; count: number }>, overallAvg: number) {
  // 표본 2개 이상인 mood만 사용
  const rows = Object.entries(moodStats)
    .filter(([, v]) => v.count >= 2)
    .map(([k, v]) => ({ mood: k, avg: v.sum / v.count, n: v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (rows.length < 2 || overallAvg === 0) {
    return "기분↔에너지 패턴은 표본이 더 필요해. (같은 기분이 2번 이상 쌓이면 정확도가 확 올라가.)";
  }

  const top = rows[0];
  const bottom = rows[rows.length - 1];

  const topDiff = top.avg - overallAvg;
  const botDiff = overallAvg - bottom.avg;

  // “간이상관 느낌” 문장: 방향 + 근거(표본)
  const parts: string[] = [];

  parts.push(
    `기분↔에너지(간이분석): ${
      MOOD_ICON[top.mood] ?? "🙂"
    } ${MOOD_LABEL[top.mood] ?? top.mood}일 때 평균 에너지가 ${top.avg.toFixed(1)}/5 (n=${top.n})로 가장 높았어.`
  );

  parts.push(
    `${
      MOOD_ICON[bottom.mood] ?? "🙂"
    } ${MOOD_LABEL[bottom.mood] ?? bottom.mood}일 때는 ${bottom.avg.toFixed(1)}/5 (n=${bottom.n})로 가장 낮았고.`
  );

  // 코치 조언
  if (topDiff >= 0.6) {
    parts.push("코치의 힌트: 이 기분이 뜨는 날엔 ‘중요한 일 1개’로 확장하는 게 효율이 좋아.");
  } else if (botDiff >= 0.6) {
    parts.push("코치의 힌트: 낮은 쪽 기분이 오면 목표를 ‘회복’으로 바꾸자. 루틴 1개만 지켜도 충분해.");
  } else {
    parts.push("코치의 힌트: 기분에 따른 에너지 차이는 크지 않아 보여. 꾸준함이 승부처야.");
  }

  return parts.join(" ");
}

function topicEnergyCoaching(topicStats: Record<string, { sum: number; count: number }>, overallAvg: number) {
  const rows = Object.entries(topicStats)
    .filter(([, v]) => v.count >= 2)
    .map(([k, v]) => ({ topic: k, avg: v.sum / v.count, n: v.count }))
    .sort((a, b) => b.avg - a.avg);

  if (!rows.length || overallAvg === 0) {
    return "주제별 에너지 분석은 표본이 더 필요해. (같은 주제가 2번 이상 나오면 더 정확해져.)";
  }

  const top = rows[0];
  const bottom = rows.length >= 2 ? rows[rows.length - 1] : undefined;

  const lines: string[] = [];
  lines.push(
    `주제별 에너지: "${top.topic}"에서 평균 ${top.avg.toFixed(1)}/5 (n=${top.n})로 가장 높았어.`
  );

  if (bottom && bottom.topic !== top.topic) {
    lines.push(
      `"${bottom.topic}"에서는 ${bottom.avg.toFixed(1)}/5 (n=${bottom.n})로 가장 낮았고.`
    );
  }

  // 코치형 조언: 살리는/깎는 주제
  const topDiff = top.avg - overallAvg;
  const bottomDiff = bottom ? overallAvg - bottom.avg : 0;

  if (topDiff >= 0.5) {
    lines.push(`코치의 힌트: ${top.topic}은(는) 너를 “살리는 주제” 같아. 바쁜 날엔 이쪽을 10분이라도 확보해봐.`);
  } else {
    lines.push(`코치의 힌트: 주제에 따른 차이는 아직 크지 않아. 대신 “연속 기록”이 체감 변화를 만들 거야.`);
  }

  if (bottom && bottomDiff >= 0.5) {
    lines.push(`또 하나: ${bottom.topic}은(는) 에너지를 깎는 편이야. 이 주제는 ‘작게 쪼개서’ 처리하거나, 회복 루틴을 같이 붙이자.`);
  }

  return lines.join(" ");
}

export default function ReportScreen() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<PeriodValue>("7");

  const days = Number(period);
  const end = dayjs().format("YYYY-MM-DD");
  const start = dayjs().subtract(days - 1, "day").format("YYYY-MM-DD");

  const enabled = Boolean(user?.uid);

  const { data, isLoading, error } = useQuery({
    queryKey: ["reportRange", user?.uid, start, end],
    queryFn: () => listEntriesByRange(user!.uid, start, end),
    enabled,
    staleTime: 60_000,
  });

  const computed = useMemo(() => {
    const entries = (data ?? []) as any[];

    // 날짜 축(빈 날 포함)
    const dates = Array.from({ length: days }).map((_, i) =>
      dayjs(start).add(i, "day").format("YYYY-MM-DD")
    );

    // date -> entry
    const map = new Map<string, any>();
    entries.forEach((e) => map.set(e.date, e));

    // 에너지 시리즈(라인 차트)
    let sumEnergy = 0;
    let countEnergy = 0;

    const energySeries = dates.map((d) => {
      const e = map.get(d);
      const energy = e?.energy ? clamp1to5(Number(e.energy)) : 0;
      if (energy > 0) {
        sumEnergy += energy;
        countEnergy += 1;
      }
      return {
        value: energy,
        label: dayjs(d).format(days <= 7 ? "dd" : "MM/DD"),
        dataPointText: energy > 0 ? String(energy) : "",
      };
    });

    const avgEnergy = countEnergy ? sumEnergy / countEnergy : 0;
    const trend = trendFromSeries(energySeries.map((x) => x.value));

    // counts
    const moodCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    // stats (avg energy by mood/topic)
    const moodStats: Record<string, { sum: number; count: number }> = {};
    const topicStats: Record<string, { sum: number; count: number }> = {};

    // best / worst day (에너지 기준, 표본=기록 있는 날만)
    let best: any = null;
    let worst: any = null;

    for (const e of entries) {
      const energy = e?.energy ? clamp1to5(Number(e.energy)) : 0;
      if (energy <= 0) continue;

      if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood] ?? 0) + 1;
      if (e.topic) topicCounts[e.topic] = (topicCounts[e.topic] ?? 0) + 1;

      if (e.mood) {
        moodStats[e.mood] = moodStats[e.mood] ?? { sum: 0, count: 0 };
        moodStats[e.mood].sum += energy;
        moodStats[e.mood].count += 1;
      }
      if (e.topic) {
        topicStats[e.topic] = topicStats[e.topic] ?? { sum: 0, count: 0 };
        topicStats[e.topic].sum += energy;
        topicStats[e.topic].count += 1;
      }

      if (!best || energy > best.energy) best = e;
      if (!worst || energy < worst.energy) worst = e;
    }

    // top mood/topic
    const topMoods = toTopN(moodCounts, 5);
    const topTopics = toTopN(topicCounts, 5);

    const moodTop1 = topMoods[0]
      ? { key: topMoods[0][0] as string, count: topMoods[0][1] as number }
      : undefined;

    const topicTop1 = topTopics[0]
      ? { key: topTopics[0][0] as string, count: topTopics[0][1] as number }
      : undefined;

    // Pie (mood TOP5 + 기타)
    const totalMood = Object.values(moodCounts).reduce((a, b) => a + b, 0);
    const topMoodSum = topMoods.reduce((a, [, v]) => a + (v as number), 0);
    const other = totalMood - topMoodSum;

    const moodPie = [
      ...topMoods.map(([k, v]) => ({
        value: v as number,
        text: `${MOOD_ICON[k] ?? "🙂"} ${MOOD_LABEL[k] ?? k}`,
      })),
      ...(other > 0 ? [{ value: other, text: "기타" }] : []),
    ];

    // Bar (topic TOP5)
    const topicBars = topTopics.slice(0, 5).map(([k, v]) => ({
      value: v as number,
      label: k,
      topLabelComponent: () => (
        <Text style={{ fontSize: 12, opacity: 0.7 }}>{v as number}</Text>
      ),
    }));

    // 코치형 요약
    const summaryLines = coachSummary({
      days,
      writtenDays: countEnergy,
      avgEnergy,
      trend,
      moodTop: moodTop1,
      topicTop: topicTop1,
    });

    // 추가 3종 코칭 문장
    const bestWorstLines = bestWorstAdvice(best, worst);
    const moodEnergyLine = moodEnergyInsight(moodStats, avgEnergy);
    const topicEnergyLine = topicEnergyCoaching(topicStats, avgEnergy);

    return {
      days,
      start,
      end,
      writtenDays: countEnergy,
      avgEnergy,
      trend,
      energySeries,
      moodPie,
      topicBars,
      summaryLines,
      bestWorstLines,
      moodEnergyLine,
      topicEnergyLine,
      topTopics,
      topMoods,
    };
  }, [data, days, start, end]);

  if (!user) {
    return (
      <View style={{ padding: 16 }}>
        <Text>로그인이 필요합니다.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}>
      <Text variant="titleLarge" style={{ textAlign: "center" }}>
        리포트
      </Text>

      <SegmentedButtons
        value={period}
        onValueChange={(v) => setPeriod(v as PeriodValue)}
        buttons={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
      />

      {isLoading ? <Text>불러오는 중...</Text> : null}
      {error ? <Text>에러가 발생했습니다.</Text> : null}

      {/* 코치 요약 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">이번 기간 코칭 노트</Text>

          {computed.summaryLines.map((line, idx) => (
            <Text key={idx} style={{ lineHeight: 20 }}>
              • {line}
            </Text>
          ))}

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            <Chip>기록일 {computed.writtenDays}일</Chip>
            <Chip>평균 {computed.avgEnergy ? computed.avgEnergy.toFixed(1) : "-"} / 5</Chip>
            <Chip>페이스 {computed.trend}</Chip>
          </View>
        </Card.Content>
      </Card>

      {/* 최고의 날 / 최저의 날 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">하이라이트 코칭</Text>
          {computed.bestWorstLines.map((line, idx) => (
            <Text key={idx} style={{ lineHeight: 20 }}>
              • {line}
            </Text>
          ))}
        </Card.Content>
      </Card>

      {/* 기분 ↔ 에너지 (간이상관) */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">기분 ↔ 에너지 코칭</Text>
          <Text style={{ lineHeight: 20 }}>{computed.moodEnergyLine}</Text>
        </Card.Content>
      </Card>

      {/* 주제별 평균 에너지 코칭 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">주제별 에너지 코칭</Text>
          <Text style={{ lineHeight: 20 }}>{computed.topicEnergyLine}</Text>
        </Card.Content>
      </Card>

      {/* 에너지 추이 라인 차트 */}
      <Card>
        <Card.Content>
          <Text variant="titleMedium">에너지 추이</Text>
          <View style={{ marginTop: 10 }}>
            <LineChart
              data={computed.energySeries}
              thickness={3}
              curved
              hideRules={false}
              yAxisLabelTexts={["0", "1", "2", "3", "4", "5"]}
              yAxisTextStyle={{ fontSize: 10, opacity: 0.7 }}
              xAxisLabelTextStyle={{ fontSize: 10, opacity: 0.7 }}
              showDataPointOnFocus
              showTextOnFocus
              maxValue={5}
              noOfSections={5}
              height={160}
              spacing={computed.days <= 7 ? 34 : 18}
            />
          </View>
          <Text style={{ opacity: 0.6, marginTop: 6 }}>
            * 기록 없는 날은 0으로 표시됨
          </Text>
        </Card.Content>
      </Card>

      {/* 기분 분포 파이 */}
      <Card>
        <Card.Content>
          <Text variant="titleMedium">기분 분포</Text>
          {computed.moodPie.length ? (
            <View style={{ marginTop: 10, alignItems: "center" }}>
              <PieChart data={computed.moodPie} showText textColor="black" radius={110} textSize={11} />
            </View>
          ) : (
            <Text style={{ opacity: 0.6, marginTop: 10 }}>
              데이터가 부족해요. 기분을 조금만 더 기록해봐.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* 주제 TOP Bar */}
      <Card>
        <Card.Content>
          <Text variant="titleMedium">주제 TOP</Text>
          {computed.topicBars.length ? (
            <View style={{ marginTop: 10 }}>
              <BarChart
                data={computed.topicBars}
                barWidth={24}
                spacing={18}
                height={180}
                hideRules={false}
                xAxisLabelTextStyle={{ fontSize: 10, opacity: 0.7 }}
                yAxisTextStyle={{ fontSize: 10, opacity: 0.7 }}
                maxValue={Math.max(...computed.topicBars.map((x) => x.value), 1)}
                noOfSections={4}
              />
            </View>
          ) : (
            <Text style={{ opacity: 0.6, marginTop: 10 }}>
              주제 데이터가 부족해요. 주제 칩을 1개만 선택해도 TOP이 잡혀.
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* 작은 디버그/메타 */}
      <Card>
        <Card.Content style={{ gap: 8 }}>
          <Text variant="titleMedium">기간</Text>
          <Text style={{ opacity: 0.7 }}>
            {dayjs(computed.start).format("YYYY.MM.DD")} ~ {dayjs(computed.end).format("YYYY.MM.DD")}
          </Text>
          <Divider />
          <Text style={{ opacity: 0.6 }}>
            * “간이상관/코칭 문장”은 통계 모델이 아니라, 기록 기반의 룰·집계로 만든 개인화 문장입니다.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}
