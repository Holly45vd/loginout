// src/utils/dailyQuote.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { QUOTES, QuoteItem } from "../domain/constants/quotes";

const KEY_DAILY_QUOTE = "logdiary_daily_quote_v1";
const KEY_QUOTE_CLOSED = "logdiary_quote_closed_v1";

/** 문자열 해시 (간단/충분) */
function hashString(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** 오늘 날짜 기반으로 "오늘의 인덱스" 고정 (매일 바뀜, 하루 동안 고정) */
function getTodayIndex(seedExtra?: string) {
  const today = dayjs().format("YYYY-MM-DD");
  const seed = `${today}::${seedExtra ?? ""}::log-in-diary`;
  const h = hashString(seed);
  return QUOTES.length ? h % QUOTES.length : 0;
}

export async function getDailyQuote(uid?: string): Promise<QuoteItem | null> {
  if (!QUOTES.length) return null;

  const today = dayjs().format("YYYY-MM-DD");
  const saved = await AsyncStorage.getItem(KEY_DAILY_QUOTE);

  // 저장된 게 "오늘"이면 그대로 사용(가끔 배열 추가/삭제해도 안정적)
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed?.date === today && parsed?.quote?.text) return parsed.quote as QuoteItem;
    } catch {
      // ignore
    }
  }

  // 오늘 인덱스 새로 선택
  const idx = getTodayIndex(uid);
  const quote = QUOTES[idx];

  await AsyncStorage.setItem(
    KEY_DAILY_QUOTE,
    JSON.stringify({ date: today, quote })
  );

  return quote;
}

export async function getQuoteClosedToday(): Promise<boolean> {
  const today = dayjs().format("YYYY-MM-DD");
  const v = await AsyncStorage.getItem(KEY_QUOTE_CLOSED);
  if (!v) return false;

  try {
    const parsed = JSON.parse(v);
    return parsed?.date === today && parsed?.closed === true;
  } catch {
    return false;
  }
}

export async function setQuoteClosedToday() {
  const today = dayjs().format("YYYY-MM-DD");
  await AsyncStorage.setItem(
    KEY_QUOTE_CLOSED,
    JSON.stringify({ date: today, closed: true })
  );
}

export async function reopenQuoteToday() {
  // “오늘 다시 보기”를 누르면 닫힘 상태만 해제
  await AsyncStorage.removeItem(KEY_QUOTE_CLOSED);
}
