import { createContext, useContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type Role = "client" | "admin" | "photographer" | "videographer";
export type AuthState = { session: Session | null; role: Role | null; loading: boolean };
export const AuthContext = createContext<AuthState>({ session: null, role: null, loading: true });
export const useAuth = () => useContext(AuthContext);
