import React, { useMemo, useState } from "react";
import { View } from "react-native";
import { Button, Chip, Text, TextInput } from "react-native-paper";

type Props = {
  title?: string;
  defaultTopics: readonly string[];
  extraTopics?: readonly string[];
  selectedTopics: string[];
  onChangeSelectedTopics: (next: string[]) => void;

  /** 추가된 커스텀 토픽을 저장하고 싶으면 부모에서 넘겨도 됨(옵션) */
  initialCustomTopics?: string[];
  onCustomTopicsChange?: (next: string[]) => void;

  /** +추가 칩 라벨 */
  addLabel?: string;
};

function toggleArr(arr: string[], v: string) {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export default function TopicPicker({
  title = "오늘의 주제",
  defaultTopics,
  extraTopics = [],
  selectedTopics,
  onChangeSelectedTopics,
  initialCustomTopics = [],
  onCustomTopicsChange,
  addLabel = "추가",
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [customTopics, setCustomTopics] = useState<string[]>(initialCustomTopics);

  const topicCandidates = useMemo(() => {
    // 중복 제거
    const all = [...defaultTopics, ...extraTopics, ...customTopics].map((x) => String(x));
    return Array.from(new Set(all));
  }, [defaultTopics, extraTopics, customTopics]);

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

    // 추가하자마자 선택도 해줌
    if (!selectedTopics.includes(v)) {
      onChangeSelectedTopics([...selectedTopics, v]);
    }

    setDraft("");
    setIsAdding(false);
  }

  function cancel() {
    setDraft("");
    setIsAdding(false);
  }

  return (
    <View style={{ gap: 10 }}>
      {!!title && (
        <Text variant="titleMedium" style={{ marginBottom: 2 }}>
          {title}
        </Text>
      )}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {topicCandidates.map((t) => {
          const selected = selectedTopics.includes(t);
          return (
            <Chip
              key={t}
              selected={selected}
              onPress={() => onChangeSelectedTopics(toggleArr(selectedTopics, t))}
              mode="outlined"
            >
              {t}
            </Chip>
          );
        })}

        {/* 마지막: +추가 → 인풋으로 변신 */}
        {!isAdding ? (
          <Chip icon="plus" mode="outlined" onPress={() => setIsAdding(true)}>
            {addLabel}
          </Chip>
        ) : (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              minWidth: 240,
              flexGrow: 1,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              mode="outlined"
              placeholder="주제 추가"
              style={{ flex: 1, height: 40 }}
              autoFocus
              onSubmitEditing={commit}
              returnKeyType="done"
            />
            <Button mode="contained" onPress={commit} compact>
              저장
            </Button>
            <Button mode="text" onPress={cancel} compact>
              취소
            </Button>
          </View>
        )}
      </View>
    </View>
  );
}
