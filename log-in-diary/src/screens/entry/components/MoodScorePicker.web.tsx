import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MOOD_SCORE_ICONS } from "../../../domain/constants/moodIcons";

export default function MoodScorePicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
      {MOOD_SCORE_ICONS.map((m) => {
        const selected = value === m.score;

        return (
          <div
            key={m.score}
            onClick={() => onChange(m.score)}
            style={{
              width: 86,
              height: 64,
              borderRadius: 14,
              border: `2px solid ${
                selected ? "#14235A" : "rgba(0,0,0,0.12)"
              }`,
              background: selected
                ? "rgba(20,35,90,0.06)"
                : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <FontAwesomeIcon
              icon={m.icon}
              fontSize={28}
              color={selected ? "#14235A" : "#9E9E9E"}
            />
          </div>
        );
      })}
    </div>
  );
}
