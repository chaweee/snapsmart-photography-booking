// Admin-only connectivity check. Never returns Cloudinary credentials or files.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
};
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply(405, "Method not allowed");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "Login required");
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME");
  const key = Deno.env.get("CLOUDINARY_API_KEY");
  const secret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!url || !anon || !cloud || !key || !secret) return reply(503, "Server configuration is incomplete");
  const supabase = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return reply(401, "Login required");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return reply(403, "Admin access required");
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/ping`, {
      headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}` },
    });
    if (!response.ok) return reply(502, "Cloudinary connection failed; check the server secrets and Cloudinary account.");
    return reply(200, "Cloudinary credentials verified. No files were changed.");
  } catch {
    return reply(502, "Cloudinary could not be reached. Try again later.");
  }
});
