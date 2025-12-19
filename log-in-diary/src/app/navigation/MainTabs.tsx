import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, Animated, Easing } from "react-native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Text } from "react-native-paper";

import HomeScreen from "../../screens/home/HomeScreen";
import CalendarScreen from "../../screens/calendar/CalendarScreen";
import EntryEditorScreen from "../../screens/entry/EntryEditorScreen";
import ReportScreen from "../../screens/report/ReportScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator();

// ✅ 과일 아이콘 + 선택된 탭만 텍스트
const TAB_META: Record<string, { label: string; icon: string }> = {
  Home: { label: "홈", icon: "🍓" },
  Calendar: { label: "캘린더", icon: "🍏" },
  Write: { label: "기록", icon: "🍑" },
  Report: { label: "리포트", icon: "🍇" },
  Profile: { label: "내정보", icon: "🍋" },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const routes = state.routes;
  const n = routes.length;

  // 레이아웃 계산용
  const [innerWidth, setInnerWidth] = useState(0);

  // pill 이동 애니메이션
  const pillX = useRef(new Animated.Value(0)).current;

  // 탭 간격(가운데 빈 공간 느낌)
  const GAP = 10;

  const tabWidth = useMemo(() => {
    if (!innerWidth || n === 0) return 0;
    // innerWidth = (전체 내부폭) = (탭 n개 폭 합) + (gap*(n-1))
    return (innerWidth - GAP * (n - 1)) / n;
  }, [innerWidth, n]);

  // index 바뀔 때 pill 이동
  useEffect(() => {
    if (!tabWidth) return;
    const to = state.index * (tabWidth + GAP);

    Animated.timing(pillX, {
      toValue: to,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth, pillX]);

  // 눌림(press) 스케일 애니메이션: per-tab
  const pressMapRef = useRef<Record<string, Animated.Value>>({});
  routes.forEach((r) => {
    if (!pressMapRef.current[r.key]) pressMapRef.current[r.key] = new Animated.Value(1);
  });

  const activeBg = "rgba(40,40,160,0.95)";
  const inactiveIcon = "rgba(0,0,0,0.55)";

  return (
    <View
      style={{
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: "rgba(255,255,255,0.96)",
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      {/* 내부 row: 여기 폭을 재서 tabWidth 계산 */}
      <View
        onLayout={(e) => setInnerWidth(e.nativeEvent.layout.width)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: GAP,
          position: "relative",
          height: 44,
        }}
      >
        {/* ✅ 슬라이딩 pill (배경) */}
        {tabWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: tabWidth,
              borderRadius: 16,
              backgroundColor: activeBg,
              transform: [{ translateX: pillX }],
            }}
          />
        )}

        {/* ✅ 탭 버튼들 */}
        {routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta = TAB_META[route.name] ?? { label: route.name, icon: "🍒" };
          const press = pressMapRef.current[route.key];

          const onPressIn = () => {
            Animated.spring(press, {
              toValue: 0.96,
              friction: 7,
              tension: 130,
              useNativeDriver: true,
            }).start();
          };

          const onPressOut = () => {
            Animated.spring(press, {
              toValue: 1,
              friction: 7,
              tension: 110,
              useNativeDriver: true,
            }).start();
          };

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              style={{ flex: 1 }}
            >
              <Animated.View
                style={{
                  height: 44,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: isFocused ? 8 : 0,
                  paddingHorizontal: isFocused ? 12 : 0,
                  transform: [{ scale: press }],
                }}
              >
                <Text
                  style={{
                    fontSize: isFocused ? 22 : 20,
                    color: isFocused ? "#fff" : inactiveIcon,
                  }}
                >
                  {meta.icon}
                </Text>

                {/* ✅ 선택된 탭만 라벨 노출 */}
                {isFocused ? (
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    {meta.label}
                  </Text>
                ) : null}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // 기본 탭바 숨김
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Write" component={EntryEditorScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
