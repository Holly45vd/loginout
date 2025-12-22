// /workspaces/loginout/log-in-diary/src/app/navigation/MainTabs.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, Animated, Easing, Platform } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { Text } from "react-native-paper";

// ✅ Expo 프로젝트에서는 이게 정답
import { MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "../../screens/home/HomeScreen";
import CalendarScreen from "../../screens/calendar/CalendarScreen";
import EntryEditorScreen from "../../screens/entry/EntryEditorScreen";
import ReportScreen from "../../screens/report/ReportScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

const Tab = createBottomTabNavigator();

// ✅ MUI 느낌(Material Icons)으로 아이콘 매핑
// (MaterialIcons glyph는 문자열 리터럴로 충분히 잘 잡힘)
const TAB_META: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }
> = {
  Home: { label: "홈", icon: "home" },
  Calendar: { label: "캘린더", icon: "calendar-today" },
  Write: { label: "기록", icon: "edit" }, // "edit-note"가 없을 수 있어 안전하게 "edit"
  Report: { label: "리포트", icon: "insert-chart" }, // outlined 필요하면 "insert-chart-outlined" 시도 가능
  Profile: { label: "내정보", icon: "account-circle" },
};

function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const routes = state.routes;
  const n = routes.length;

  const [innerWidth, setInnerWidth] = useState(0);
  const pillX = useRef(new Animated.Value(0)).current;

  const GAP = 10;

  const tabWidth = useMemo(() => {
    if (!innerWidth || n === 0) return 0;
    return (innerWidth - GAP * (n - 1)) / n;
  }, [innerWidth, n]);

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
    if (!pressMapRef.current[r.key]) {
      pressMapRef.current[r.key] = new Animated.Value(1);
    }
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
        {/* ✅ 슬라이딩 pill */}
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

        {routes.map((route, index) => {
          const isFocused = state.index === index;
          const meta =
            TAB_META[route.name] ??
            ({ label: route.name, icon: "circle" } as any);

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
                <MaterialIcons
                  name={meta.icon}
                  size={isFocused ? 24 : 22}
                  color={isFocused ? "#fff" : inactiveIcon}
                />

                {isFocused ? (
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
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
        tabBarStyle: { display: "none" },
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
