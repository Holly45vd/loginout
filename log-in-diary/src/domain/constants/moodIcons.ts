import {
  faFaceSadTear,
  faFaceTired,
  faFaceMeh,
  faFaceSmileWink,
  faFaceLaughBeam,
} from "@fortawesome/free-solid-svg-icons";

export const MOOD_SCORE_ICONS = [
  { score: 1, icon: faFaceSadTear, label: "최악" },
  { score: 2, icon: faFaceTired, label: "별로" },
  { score: 3, icon: faFaceMeh, label: "보통" },
  { score: 4, icon: faFaceSmileWink, label: "좋음" },
  { score: 5, icon: faFaceLaughBeam, label: "최고" },
] as const;
