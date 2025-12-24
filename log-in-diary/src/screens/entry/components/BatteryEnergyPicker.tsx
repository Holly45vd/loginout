import React, { useEffect, useMemo, useRef } from "react";
import { View, Pressable, Animated, Easing, useWindowDimensions, Platform } from "react-native";
import { Text } from "react-native-paper";

type Props = {
  value?: number; // 0~5
  onChange: (next: number) => void;
  showPercent?: boolean;
  showLabels?: boolean;
};

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

function colorForLevel(level: number) {
  if (level <= 1) return "#E53935";
  if (level === 2) return "#FB8C00";
  if (level === 3) return "#FDD835";
  if (level === 4) return "#9CCC65";
  return "#43A047";
}

export default function BatteryEnergyPicker({
  value = 0,
  onChange,
  showPercent = true,
  showLabels = true,
}: Props) {
  const v = clamp(Number(value) || 0, 0, 5);
  const { width: screenW } = useWindowDimensions();

  const dims = useMemo(() => {
    const w = clamp(Math.floor(screenW * 0.82), 280, 520);
    const h = clamp(Math.floor(w * 0.22), 72, 120);
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

  const fillColor = v === 0 ? "transparent" : colorForLevel(v);

  const anim = useRef(new Animated.Value(v)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: v,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [v, anim]);

  const filledWidth = anim.interpolate({
    inputRange: [0, 5],
    outputRange: [0, (segW + dims.segGap) * 5 - dims.segGap],
  });

  const percent = v * 20;

  const containerShadow =
    Platform.OS === "web"
      ? ({ boxShadow: "0px 8px 24px rgba(0,0,0,0.10)" } as any)
      : ({
          shadowColor: "#000",
          shadowOpacity: 0.10,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 4,
        } as any);

  return (
    <View style={{ gap: 12 }}>
      {showPercent && (
        <Text style={{ fontWeight: "900" as any, opacity: 0.85 }}>{percent}%</Text>
      )}

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
            ...containerShadow,
          }}
        >
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: dims.pad,
              top: dims.pad,
              height: segH,
              width: filledWidth,
              borderRadius: dims.segRadius,
              backgroundColor: fillColor,
              opacity: 0.18,
            }}
          />

          <View style={{ flexDirection: "row", gap: dims.segGap }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const level = i + 1;

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
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: dims.w }}>
          <Text style={{ opacity: 0.55 }}>방전</Text>
          <Text style={{ opacity: 0.55 }}>풀충전</Text>
        </View>
      )}
    </View>
  );
}
