// src/assets/moodImages.ts

/**
 * Mood Image Mapping
 *
 * normal : 기본 상태 (B_ prefix, 모노톤)
 * active : 선택/강조 상태 (컬러)
 */

export type MoodKey =
  | "anxiety"
  | "coldness"
  | "lethargy"
  | "lonely"
  | "calm"
  | "sadness"
  | "happiness"
  | "hope"
  | "growth"
  | "confident";

export const MOOD_IMAGE: Record<
  MoodKey,
  {
    normal: any;
    active: any;
  }
> = {
  /** 불안 */
  anxiety: {
    normal: require("./B_cloudrain.png"),
    active: require("./cloudrain.png"),
  },

  /** 차가움 / 거리감 */
  coldness: {
    normal: require("./B_cloudsnow.png"),
    active: require("./cloudsnow.png"),
  },

  /** 무기력 */
  lethargy: {
    normal: require("./B_mooncloud.png"),
    active: require("./mooncloud.png"),
  },

  /** 외로움 */
  lonely: {
    normal: require("./B_moonstar.png"),
    active: require("./moonstar.png"),
  },

  /** 평온 */
  calm: {
    normal: require("./B_cloudcloud.png"),
    active: require("./cloudcloud.png"),
  },

  /** 슬픔 */
  sadness: {
    normal: require("./B_cloudrainsnow.png"),
    active: require("./cloudrainsnow.png"),
  },

  /** 행복 */
  happiness: {
    normal: require("./B_glosses.png"),
    active: require("./glosses.png"),
  },

  /** 희망 */
  hope: {
    normal: require("./B_leaf.png"),
    active: require("./leaf.png"),
  },

  /** 성장 */
  growth: {
    normal: require("./B_tree.png"),
    active: require("./tree.png"),
  },

  /** 자신감 */
  confident: {
    normal: require("./B_umbrella.png"),
    active: require("./umbrella.png"),
  },
};

/** 예외/백업용 */
export const DEFAULT_MOOD_IMAGE = {
  normal: require("./earth.png"),
  active: require("./up.png"),
};
