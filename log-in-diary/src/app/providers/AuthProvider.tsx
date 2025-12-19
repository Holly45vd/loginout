import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../data/firebase/firebase";

type AuthCtx = {
  user: User | null;
  booting: boolean;
};

const Ctx = createContext<AuthCtx>({ user: null, booting: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    // ✅ 무한 로딩 방지 타임아웃 (개발환경에서만 사실상 보험)
    const guard = setTimeout(() => {
      console.warn("[AUTH] guard timeout -> force booting=false");
      setBooting(false);
    }, 3000);

    try {
      const unsub = onAuthStateChanged(
        auth,
        (u) => {
          console.log("[AUTH] state changed:", u?.uid ?? null);
          clearTimeout(guard);
          setUser(u);
          setBooting(false);
        },
        (err) => {
          console.error("[AUTH] onAuthStateChanged error:", err);
          clearTimeout(guard);
          setBooting(false);
        }
      );

      return () => {
        clearTimeout(guard);
        unsub();
      };
    } catch (e) {
      console.error("[AUTH] subscribe crashed:", e);
      clearTimeout(guard);
      setBooting(false);
    }
  }, []);

  const value = useMemo(() => ({ user, booting }), [user, booting]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
