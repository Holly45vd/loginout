import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Pressable,
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { Text } from "react-native-paper";

type Props = {
  value?: number; // 0~5
  onChange: (next: number) => void;
  showPercent?: boolean;
  showLabels?: boolean;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function colorForLevel(level: number) {
  if (level <= 1) return "#E53935"; // red
  if (level === 2) return "#FB8C00"; // orange
  if (level === 3) return "#FDD835"; // yellow
  if (level === 4) return "#9CCC65"; // light green
  return "#43A047"; // green
}

export default function BatteryEnergyPicker({
  value = 0,
  onChange,
  showPercent = true,
  showLabels = true,
}: Props) {
  const v = clamp(value, 0, 5);
  const { width: screenW } = useWindowDimensions();

  // ✅ 화면에 맞춘 반응형 크기 (기분 카드처럼 큼직하게)
  const dims = useMemo(() => {
    const w = clamp(Math.floor(screenW * 0.82), 280, 520);
    const h = clamp(Math.floor(w * 0.22), 72, 120); // 비율로 키움
    const pad = clamp(Math.floor(h * 0.16), 12, 18);
    const capW = clamp(Math.floor(h * 0.22), 16, 28);
    const bodyRadius = clamp(Math.floor(h * 0.32), 18, 30);
    const segGap = clamp(Math.floor(w * 0.02), 8, 14);
    const segRadius = clamp(Math.floor(h * 0.24), 12, 18);

    return { w, h, pad, capW, bodyRadius, segGap, segRadius };
  }, [screenW]);

  const innerW = dims.w - dims.pad * 2 - dims.capW;
  const segW = (innerW - dims.segGap * 4) / 5;
  const segH = dims.h - dims.pad * 2;

  // ✅ 색상은 “현재 단계” 기준으로 통일(모던하게)
  const fillColor = v === 0 ? "transparent" : colorForLevel(v);

  // ✅ 애니메이션 값: 0~5 (부드럽게 이동)
  const anim = useRef(new Animated.Value(v)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: v,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width/opacity는 native driver 불가
    }).start();
  }, [v, anim]);

  // ✅ 채워진 폭(= (칸폭+간격)*anim - 간격)
  const filledWidth = anim.interpolate({
    inputRange: [0, 5],
    outputRange: [0, (segW + dims.segGap) * 5 - dims.segGap],
  });

  // ✅ 하이라이트 폭도 같이 애니메이션
  const highlightWidth = filledWidth;

  const percent = v * 20;

  return (
    <View style={{ gap: 12 }}>
      {showPercent && (
        <Text style={{ fontWeight: "900" as any, opacity: 0.85 }}>
          {percent}%
        </Text>
      )}

      {/* 배터리 */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            width: dims.w,
            height: dims.h,
            borderRadius: dims.bodyRadius,
            backgroundColor: "white",
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.10)",
            padding: dims.pad,
            position: "relative",

            // ✅ 더 “고급” 그림자
            shadowColor: "#000",
            shadowOpacity: 0.10,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          {/* ✅ 채움 레이어(뒤에서부터 차오르는 느낌) */}
          {/* 칸 형태를 유지하려면 ‘칸’은 그대로 두고, 색을 애니메이션 폭으로 깔아준다 */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: dims.pad,
              top: dims.pad,
              height: segH,
              width: highlightWidth,
              borderRadius: dims.segRadius,
              backgroundColor: fillColor,
              opacity: 0.18, // 은은하게 깔아주기(싸구려 방지)
            }}
          />

          {/* 5칸 */}
          <View style={{ flexDirection: "row", gap: dims.segGap }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const level = i + 1;

              // ✅ “칸별 색”도 애니메이션으로 부드럽게
              // anim >= level 이면 채움. 경계는 0~1로 스무스 처리.
              const cellOpacity = anim.interpolate({
                inputRange: [level - 0.35, level, level + 0.35],
                outputRange: [0.15, 1, 1],
                extrapolate: "clamp",
              });

              return (
                <Pressable
                  key={level}
                  onPress={() => onChange(level)}
                  style={{
                    width: segW,
                    height: segH,
                    borderRadius: dims.segRadius,
                    backgroundColor: "rgba(0,0,0,0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.04)",
                    overflow: "hidden",
                  }}
                >
                  {/* 채움(칸 내부) */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: fillColor,
                      opacity: cellOpacity,
                    }}
                  />
                  {/* 상단 유리광 */}
                  <Animated.View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      height: segH * 0.32,
                      backgroundColor: "rgba(255,255,255,0.35)",
                      opacity: cellOpacity,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>

          {/* 배터리 캡(단자) */}
          <View
            style={{
              position: "absolute",
              right: -dims.capW + 2,
              top: dims.h * 0.28,
              width: dims.capW,
              height: dims.h * 0.44,
              borderTopRightRadius: dims.bodyRadius * 0.55,
              borderBottomRightRadius: dims.bodyRadius * 0.55,
              backgroundColor: "white",
              borderWidth: 1,
              borderLeftWidth: 0,
              borderColor: "rgba(0,0,0,0.10)",
            }}
          />
        </View>
      </View>

      {showLabels && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: dims.w,
          }}
        >
          <Text style={{ opacity: 0.55 }}>방전</Text>
          <Text style={{ opacity: 0.55 }}>풀충전</Text>
        </View>
      )}
    </View>
  );
}
