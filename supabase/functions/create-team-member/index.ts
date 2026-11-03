import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" };
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply(405, "Method not allowed.");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "Please log in as an administrator.");
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !serviceKey) return reply(503, "Server configuration is incomplete.");
  const caller = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await caller.auth.getUser();
  if (authError || !user) return reply(401, "Please log in as an administrator.");
  const { data: profile, error: profileError } = await caller.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return reply(403, "Only administrators can create team accounts.");
  try {
    const body = await request.json();
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = body.role;
    if (!fullName || fullName.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || (phone && !/^\d{11}$/.test(phone)) || password.length < 8 || password.length > 128 || !["photographer", "videographer"].includes(role)) return reply(400, "Check the name, email, optional 11-digit phone, password, and role.");
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    // Admin provides and shares the initial password. Email is confirmed by admin,
    // not by the account holder; do not treat it as independently verified.
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName, phone } });
    if (error || !data.user) return reply(400, "Account could not be created. Check the email and password, and ensure the email is not already registered.");
    const { data: updated, error: updateError } = await admin.from("profiles").update({ full_name: fullName, phone: phone || null, role }).eq("id", data.user.id).select("id,role").maybeSingle();
    if (updateError || !updated || updated.role !== role) return reply(500, "The login was created, but the team role could not be set. Do not retry; contact the administrator to review the account.");
    return reply(200, "Team account created. Share the email and initial password privately.");
  } catch { return reply(500, "Unable to confirm account creation. Check existing accounts before retrying."); }
});
