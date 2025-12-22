import React, { useState } from "react";
import { View, Pressable, Image, Platform } from "react-native";
import { Surface, Text } from "react-native-paper";
import { MOOD_IMAGE, DEFAULT_MOOD_IMAGE } from "../../../assets/moodImages";

export type MoodKey =
  | "anxiety"
  | "lethargy"
  | "lonely"
  | "calm"
  | "sadness"
  | "happiness"
  | "hope"
  | "growth"
  | "confident";

// ✅ 10개 → 9개 (coldness 제거)
const MOODS_9: Array<{ key: MoodKey; en: string; ko: string }> = [
  { key: "anxiety", en: "Anxiety", ko: "불안" },
  { key: "lethargy", en: "Lethargy", ko: "무기력" },
  { key: "lonely", en: "Lonely", ko: "외로움" },

  { key: "calm", en: "Calm", ko: "평온" },
  { key: "sadness", en: "Sadness", ko: "슬픔" },
  { key: "happiness", en: "Happiness", ko: "행복" },

  { key: "hope", en: "Hope", ko: "희망" },
  { key: "growth", en: "Growth", ko: "성장" },
  { key: "confident", en: "Confident", ko: "자신감" },
];

type Props = {
  title?: string;
  value?: MoodKey;
  onChange: (next: MoodKey) => void;
  columns?: 3; // 지금은 3 고정 추천
};

export default function MoodGridPicker({
  title = "오늘의 기분",
  value,
  onChange,
}: Props) {
  const [hovered, setHovered] = useState<MoodKey | null>(null);

  return (
    <View style={{ gap: 10 }}>
      <Text
        variant="titleMedium"
        style={{ textAlign: "center", marginBottom: 2 }}
      >
        {title}
      </Text>

      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {MOODS_9.map((m) => {
          const selected = value === m.key;
          const isHover = Platform.OS === "web" && hovered === m.key;
          const active = selected || isHover;

          const img = (MOOD_IMAGE as any)[m.key] ?? DEFAULT_MOOD_IMAGE;

          return (
            <Pressable
              key={m.key}
              onPress={() => onChange(m.key)}
              onHoverIn={() => setHovered(m.key)}
              onHoverOut={() => setHovered(null)}
              style={{
                width: "33.3333%",
                padding: 8,
              }}
            >
              <Surface
                elevation={active ? 3 : 0}
                style={{
                  borderRadius: 18,
                  height: 110,
                  overflow: "hidden",
                  borderWidth: 2,
                  borderColor: active
                    ? "rgba(20,35,90,0.95)"
                    : "rgba(0,0,0,0.10)",
                  backgroundColor: "white",
                  position: "relative",
                }}
              >
                {/* ✅ 뒤에 크게: normal=모노톤 / active=컬러 */}
                <Image
                  source={active ? img.active : img.normal}
                  resizeMode="contain"
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -8,
                    width: 120,
                    height: 120,
                    opacity: active ? 0.22 : 0.14,
                    transform: [{ rotate: "-8deg" }],
                  }}
                />

                {/* ✅ hover/선택 시 텍스트 오버레이 */}
                <View
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    right: 12,
                    opacity: active ? 1 : 0,
                  }}
                >
                  <Text style={{ fontWeight: "900" as any, fontSize: 14 }}>
                    {m.en}
                  </Text>
                  <Text style={{ opacity: 0.75, marginTop: 2 }}>{m.ko}</Text>
                </View>

                {/* ✅ 기본 상태: 작은 점 */}
                {!active && (
                  <View
                    style={{
                      position: "absolute",
                      left: 12,
                      top: 12,
                      width: 8,
                      height: 8,
                      borderRadius: 99,
                      backgroundColor: "rgba(0,0,0,0.12)",
                    }}
                  />
                )}
              </Surface>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
