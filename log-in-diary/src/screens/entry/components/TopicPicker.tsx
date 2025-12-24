import React, { useMemo, useState } from "react";
import { View, Platform } from "react-native";
import { Chip, Text, TextInput } from "react-native-paper";

type Props = {
  title?: string;
  defaultTopics: readonly string[];
  extraTopics?: readonly string[];

  // ✅ 신버전(너가 쓰는 방식)
  topics?: string[];
  onChange?: (next: string[]) => void;

  // ✅ 구버전(예전 방식)
  selectedTopics?: string[];
  onChangeSelectedTopics?: (next: string[]) => void;

  // ✅ 단일/다중 선택
  multiple?: boolean; // default false (단일 선택)

  /** 커스텀 토픽 */
  initialCustomTopics?: string[];
  onCustomTopicsChange?: (next: string[]) => void;

  /** +추가 라벨 */
  addLabel?: string;
};

export default function TopicPicker({
  title = "오늘의 주제",
  defaultTopics,
  extraTopics = [],

  topics,
  onChange,

  selectedTopics,
  onChangeSelectedTopics,

  multiple = false,

  initialCustomTopics = [],
  onCustomTopicsChange,

  addLabel = "+추가",
}: Props) {
  // ✅ props 호환: 둘 중 들어온 걸로 통일
  const sel = (topics ?? selectedTopics ?? []) as string[];
  const setSel =
    onChange ??
    onChangeSelectedTopics ??
    (() => {
      /* no-op */
    });

  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [customTopics, setCustomTopics] = useState<string[]>(initialCustomTopics);

  const topicCandidates = useMemo(() => {
    const all = [...defaultTopics, ...extraTopics, ...customTopics].map((x) => String(x));
    return Array.from(new Set(all));
  }, [defaultTopics, extraTopics, customTopics]);

  function onPressTopic(t: string) {
    if (multiple) {
      const next = sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t];
      setSel(next);
      return;
    }
    // ✅ 단일 선택: 누르면 그거 하나만, 다시 누르면 해제
    const next = sel[0] === t ? [] : [t];
    setSel(next);
  }

  function commit() {
    const v = draft.trim();
    if (!v) {
      setDraft("");
      setIsAdding(false);
      return;
    }

    // 커스텀 목록 업데이트
    setCustomTopics((prev) => {
      const next = prev.includes(v) ? prev : [...prev, v];
      onCustomTopicsChange?.(next);
      return next;
    });

    // 추가하자마자 선택도
    if (multiple) {
      if (!sel.includes(v)) setSel([...sel, v]);
    } else {
      setSel([v]);
    }

    setDraft("");
    setIsAdding(false);
  }

  function cancel() {
    setDraft("");
    setIsAdding(false);
  }

  // ✅ Chip과 최대한 비슷한 입력 UI
  const chipLikeInputStyle = {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.18)",
    backgroundColor: "rgba(255,255,255,1)",
    paddingHorizontal: 12,
    height: 34,
    minWidth: 96,
    justifyContent: "center" as const,
  };

  return (
    <View style={{ gap: 10 }}>
      {!!title && (
        <Text variant="titleMedium" style={{ marginBottom: 2 }}>
          {title}
        </Text>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {topicCandidates.map((t) => {
          const selected = Array.isArray(sel) ? sel.includes(t) : false;
          return (
            <Chip
              key={t}
              selected={selected}
              onPress={() => onPressTopic(t)}
              mode="outlined"
              style={{ borderRadius: 999 }}
            >
              {t}
            </Chip>
          );
        })}

        {/* 마지막: +추가 → 칩 자리에서 바로 입력 */}
        {!isAdding ? (
          <Chip icon="plus" mode="outlined" onPress={() => setIsAdding(true)} style={{ borderRadius: 999 }}>
            {addLabel}
          </Chip>
        ) : (
          <View style={[chipLikeInputStyle, { flexDirection: "row", alignItems: "center" }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="추가"
              mode="flat"
              dense
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                height: 32,
                paddingHorizontal: 0,
                ...(Platform.OS === "web" ? { outlineStyle: "none" as any } : null),
              }}
              contentStyle={{ paddingVertical: 0 }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={commit}
              onBlur={() => {
                // 웹에서 blur로 빠질 때 자연스럽게 종료
                if (!draft.trim()) cancel();
              }}
              right={
                // react-native-paper v5는 right icon을 쓰려면 TextInput.Icon 형태인데,
                // 여기선 단순하게 엔터로 처리하는 UX가 더 깔끔함.
                undefined as any
              }
            />
          </View>
        )}
      </View>

      {/* 추가 중일 때 “취소” 하나는 있어야 UX가 안 막힘 (칩 아래에 작게) */}
      {isAdding && (
        <View style={{ marginTop: 4 }}>
          <Text
            onPress={cancel as any}
            style={{ opacity: 0.6, textDecorationLine: "underline" }}
          >
            취소
          </Text>
        </View>
      )}
    </View>
  );
}
