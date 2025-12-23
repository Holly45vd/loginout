import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, Animated, Easing } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";

import HomeScreen from "../../screens/home/HomeScreen";
import CalendarScreen from "../../screens/calendar/CalendarScreen";
import DayDetailScreen from "../../screens/calendar/DayDetailScreen";
import EntryEditorScreen from "../../screens/entry/EntryEditorScreen";
import ReportScreen from "../../screens/report/ReportScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

// ✅ 기존 경로 그대로 (너 RootNavigator에 있던 경로)
import RecentDiaryListScreen from "../../screens/home/components/RecentDiaryListScreen";

const Tab = createBottomTabNavigator();

/** =========================
 *  Stack Param Lists
 *  ========================= */
export type HomeStackParamList = {
  Home: undefined;
  RecentDiaryList: undefined;
};

export type CalendarStackParamList = {
  Calendar: undefined;
  DayDetail: { date: string };
  EntryEditor: { date?: string } | undefined;
};

export type WriteStackParamList = {
  WriteHome: undefined;
  EntryEditor: { date?: string } | undefined;
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
const WriteStack = createNativeStackNavigator<WriteStackParamList>();

/** =========================
 *  Home Stack (탭 유지)
 *  ========================= */
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="RecentDiaryList"
        component={RecentDiaryListScreen}
        options={{
          headerShown: true,
          title: "최근 나의 일기",
          headerBackTitleVisible: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

/** =========================
 *  Calendar Stack (DayDetail / EntryEditor push)
 *  ========================= */
function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator>
      <CalendarStack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <CalendarStack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{
          headerShown: true,
          title: "일기 상세",
          headerBackTitleVisible: false,
        }}
      />
      <CalendarStack.Screen
        name="EntryEditor"
        component={EntryEditorScreen}
        options={{
          headerShown: true,
          title: "일기 작성/수정",
          headerBackTitleVisible: false,
        }}
      />
    </CalendarStack.Navigator>
  );
}

/** =========================
 *  Write Stack (탭 “기록”에서 EntryEditor 진입)
 *  ========================= */
function WriteStackNavigator() {
  // 탭 “기록”을 눌렀을 때 바로 EntryEditor를 보여주고 싶으면
  // WriteHome 없이 EntryEditor만 두는 방법도 있는데,
  // RN Navigation 구조상 스택 첫 화면이 필요해서 이렇게 둠.
  return (
    <WriteStack.Navigator>
      <WriteStack.Screen
        name="WriteHome"
        component={EntryEditorScreen}
        options={{ headerShown: false }}
        initialParams={undefined}
      />
      <WriteStack.Screen
        name="EntryEditor"
        component={EntryEditorScreen}
        options={{
          headerShown: true,
          title: "일기 작성/수정",
          headerBackTitleVisible: false,
        }}
      />
    </WriteStack.Navigator>
  );
}

/** =========================
 *  Floating TabBar (MUI 느낌)
 *  ========================= */
const TAB_META: Record<
  string,
  { label: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }
> = {
  Home: { label: "홈", icon: "home" },
  CalendarTab: { label: "캘린더", icon: "calendar-today" },
  WriteTab: { label: "기록", icon: "edit" },
  Report: { label: "리포트", icon: "insert-chart" },
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
            TAB_META[route.name] ?? ({ label: route.name, icon: "circle" } as any);

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

/** =========================
 *  MainTabs
 *  ========================= */
export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // 기본 탭바 숨김
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {/* ✅ Home 탭도 Stack으로 */}
      <Tab.Screen name="Home" component={HomeStackNavigator} />

      {/* ✅ Calendar 탭: DayDetail/EntryEditor push해도 탭 유지 */}
      <Tab.Screen name="CalendarTab" component={CalendarStackNavigator} />

      {/* ✅ 기록 탭: 일기 작성 진입 */}
      <Tab.Screen name="WriteTab" component={WriteStackNavigator} />

      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
