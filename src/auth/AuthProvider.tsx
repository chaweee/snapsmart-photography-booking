import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { AuthContext, type Role } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setSessionLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    let active = true;
    if (!userId) return;
    supabase.from("profiles").select("role").eq("id", userId).single().then(({ data, error }) => {
      if (active) {
        setRole(error ? null : data.role as Role);
        setRoleLoading(false);
      }
    });
    return () => { active = false; };
  }, [userId]);

  // Reset role synchronously when the identity changes; never reuse a previous user's role.
  const [lastUserId, setLastUserId] = useState<string | undefined>();
  if (lastUserId !== userId) {
    setLastUserId(userId);
    setRole(null);
    setRoleLoading(Boolean(userId));
  }

  return <AuthContext.Provider value={{ session, role, loading: sessionLoading || roleLoading }}>{children}</AuthContext.Provider>;
}
