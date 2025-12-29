// /workspaces/loginout/log-in-diary/src/app/navigation/MainTabs.tsx
import React, { useMemo, useRef } from "react";
import { View, Pressable, Animated } from "react-native";
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { Text } from "react-native-paper";

import HomeStack from "./HomeStack";
import CalendarStack from "./CalendarStack";
import EntryEditorScreen from "../../screens/entry/EntryEditorScreen";
import ReportScreen from "../../screens/report/ReportScreen";
import ProfileScreen from "../../screens/profile/ProfileScreen";

export type MainTabParamList = {
  HomeTab: undefined;
  CalendarTab: undefined;
  WriteTab: { date?: string } | undefined;
  ReportTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const w = 74;
  const pillX = useRef(new Animated.Value(0)).current;

  const routeCount = state.routes.length;
  const pillWidth = useMemo(() => w, []);
  const containerWidth = useMemo(() => routeCount * w, [routeCount]);

  React.useEffect(() => {
    Animated.spring(pillX, {
      toValue: state.index * w,
      useNativeDriver: true,
      bounciness: 10,
      speed: 14,
    }).start();
  }, [state.index, w, pillX]);

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 18,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          width: containerWidth,
          height: 58,
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.92)",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.08)",
          // RN Web: shadow 대신 boxShadow
          boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <Animated.View
          style={{
            position: "absolute",
            width: pillWidth,
            height: 50,
            top: 4,
            left: 4,
            borderRadius: 16,
            backgroundColor: "rgba(40,40,160,0.10)",
            transform: [{ translateX: pillX }],
          }}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

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
              style={{
                width: w,
                height: 58,
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              {options.tabBarIcon
                ? options.tabBarIcon({
                    focused: isFocused,
                    color: "#222",
                    size: 24,
                  })
                : null}
              {isFocused ? (
                <Text style={{ marginTop: 2, fontSize: 12, fontWeight: "700" }}>
                  {String(label).replace("Tab", "")}
                </Text>
              ) : (
                <View style={{ height: 16 }} />
              )}
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
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: "Home",
          tabBarIcon: ({ focused, size }) => (
            <MaterialIcons
              name="home"
              size={size ?? 24}
              color={focused ? "#2b2bb8" : "#222"}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CalendarTab"
        component={CalendarStack}
        options={{
          title: "Calendar",
          tabBarIcon: ({ focused, size }) => (
            <MaterialIcons
              name="calendar-month"
              size={size ?? 24}
              color={focused ? "#2b2bb8" : "#222"}
            />
          ),
        }}
      />

      <Tab.Screen
        name="WriteTab"
        component={EntryEditorScreen}
        options={{
          title: "Write",
          tabBarIcon: ({ focused, size }) => (
            <MaterialIcons
              name="edit"
              size={size ?? 24}
              color={focused ? "#2b2bb8" : "#222"}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ReportTab"
        component={ReportScreen}
        options={{
          title: "Report",
          tabBarIcon: ({ focused, size }) => (
            <MaterialIcons
              name="analytics"
              size={size ?? 24}
              color={focused ? "#2b2bb8" : "#222"}
            />
          ),
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused, size }) => (
            <MaterialIcons
              name="person"
              size={size ?? 24}
              color={focused ? "#2b2bb8" : "#222"}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
