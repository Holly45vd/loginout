import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User,
} from "firebase/auth";
import {
  doc,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

/**
 * users/{uid} 문서가 없으면 생성
 * - 과거에 가입만 하고 users 문서가 없는 계정 대응
 */
async function ensureUserDoc(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

/**
 * 회원가입
 */
export async function signUpEmailPassword(
  email: string,
  password: string,
  displayName?: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // 프로필 문서 보장
  await ensureUserDoc(cred.user);

  return cred.user;
}

/**
 * 로그인
 */
export async function signInEmailPassword(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);

  // 🔥 로그인 시에도 users 문서 보장
  await ensureUserDoc(cred.user);

  return cred.user;
}

export function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export function logout() {
  return signOut(auth);
}

export type { User };
