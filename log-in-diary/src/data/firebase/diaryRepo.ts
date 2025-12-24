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
  score: number;         // 현재 energy와 동일(레거시)
  moodScore?: number | null; // 1~5 | null
  content: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type UpsertDiaryInput = Omit<DiaryEntry, "date" | "createdAt" | "updatedAt">;

/**
 * ✅ users/{uid}/entries/{dateId}에 upsert
 * - 문서가 없을 때만 createdAt을 찍기 위해 1회 getDoc을 사용
 */
export async function upsertDiary(uid: string, dateId: string, data: UpsertDiaryInput) {
  const ref = doc(db, "users", uid, "entries", dateId);

  const snap = await getDoc(ref);
  const isNew = !snap.exists();

  await setDoc(
    ref,
    {
      ...data,
      date: dateId,
      ...(isNew ? { createdAt: serverTimestamp() } : null),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

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

export async function getEntry(uid: string, dateId: string) {
  const ref = doc(db, "users", uid, "entries", dateId);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as DiaryEntry) }) : null;
}

export async function listEntriesByRange(uid: string, startDate: string, endDate: string) {
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

export async function deleteEntry(uid: string, dateId: string) {
  const ref = doc(db, "users", uid, "entries", dateId);
  await deleteDoc(ref);
}
