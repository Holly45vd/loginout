import { Pressable } from "react-native";
import { Surface } from "react-native-paper";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { MOOD_SCORE_ICONS } from "../../../domain/constants/moodIcons";

export default function MoodScorePicker({ value, onChange }) {
  return (
    <>
      {MOOD_SCORE_ICONS.map((m) => {
        const selected = value === m.score;

        return (
          <Pressable key={m.score} onPress={() => onChange(m.score)}>
            <Surface
              elevation={selected ? 3 : 0}
              style={{
                width: 86,
                height: 64,
                borderRadius: 14,
                borderWidth: 2,
                borderColor: selected ? "#14235A" : "rgba(0,0,0,0.12)",
                backgroundColor: selected
                  ? "rgba(20,35,90,0.06)"
                  : "white",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FontAwesomeIcon
                icon={m.icon}
                size={28}
                color={selected ? "#14235A" : "#9E9E9E"}
              />
            </Surface>
          </Pressable>
        );
      })}
    </>
  );
}
