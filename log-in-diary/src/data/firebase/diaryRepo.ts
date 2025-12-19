import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export type DiaryEntry = {
  date: string;          // "YYYY-MM-DD"
  topic: string;         // 현재 string 1개
  mood: string;          // "calm" 등
  energy: number;        // 1~5
  score: number;         // 현재 energy와 동일
  content: string;
  updatedAt?: Timestamp; // ✅ 마지막 저장 시각만 관리
};

export type UpsertDiaryInput = Omit<DiaryEntry, "date" | "updatedAt">;

/**
 * ✅ users/{uid}/entries/{dateId}에 upsert
 * - 읽기 없이(setDoc 1회) 저장 비용 최소화
 * - createdAt 저장 안 함
 */
export async function upsertDiary(uid: string, dateId: string, data: UpsertDiaryInput) {
  const ref = doc(db, "users", uid, "entries", dateId);

  await setDoc(
    ref,
    {
      ...data,
      date: dateId,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * ✅ 월별 entries 조회 (캘린더용)
 * - month: "YYYY-MM"
 */
export async function listEntriesByMonth(uid: string, month: string) {
  const start = `${month}-01`;
  const end = `${month}-31`;

  const colRef = collection(db, "users", uid, "entries");
  const q = query(
    colRef,
    where("date", ">=", start),
    where("date", "<=", end),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DiaryEntry) }));
}

/**
 * ✅ 특정 날짜 1건 조회 (DayDetail용)
 */
export async function getEntry(uid: string, dateId: string) {
  const ref = doc(db, "users", uid, "entries", dateId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as DiaryEntry) }) : null;
}

/**
 * ✅ 특정 날짜 삭제 (추후 DayDetail에서 사용)
 */
export async function deleteEntry(uid: string, dateId: string) {
  const ref = doc(db, "users", uid, "entries", dateId);
  await deleteDoc(ref);
}

export async function listEntriesByRange(uid: string, startDate: string, endDate: string) {
  // startDate/endDate: "YYYY-MM-DD"
  const colRef = collection(db, "users", uid, "entries");

  const q = query(
    colRef,
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as DiaryEntry) }));
}