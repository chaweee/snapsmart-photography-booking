import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" };
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers: { ...cors, "Content-Type": "application/json" } });
async function sign(params: Record<string, string>, secret: string) {
  const text = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join("&") + secret;
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply(405, "Method not allowed");
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "Login required");
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME"), key = Deno.env.get("CLOUDINARY_API_KEY"), secret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!url || !anon || !cloud || !key || !secret) return reply(503, "Server configuration is incomplete");
  const db = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return reply(401, "Login required");
  const { data: profile, error: profileError } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") return reply(403, "Admin access required");
  try {
    const { id } = await request.json();
    if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return reply(400, "Invalid photo ID");
    const { data: photo, error: lookupError } = await db.from("portfolio_photos").select("id,public_id").eq("id", id).maybeSingle();
    if (lookupError || !photo) return reply(404, "Portfolio photo not found");
    if (!/^snapsmart\/portfolio\/[0-9a-f-]{36}$/i.test(photo.public_id)) return reply(400, "Photo cannot be deleted automatically. Contact the administrator.");
    const params = { invalidate: "true", public_id: photo.public_id, timestamp: String(Math.floor(Date.now() / 1000)), type: "upload" };
    const payload = new URLSearchParams({ ...params, api_key: key, signature: await sign(params, secret) });
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/destroy`, { method: "POST", body: payload });
    if (!response.ok) return reply(502, "Could not delete the Cloudinary file. The portfolio record was kept.");
    const result = await response.json();
    if (!["ok", "not found"].includes(result.result)) return reply(502, "Could not confirm deletion from Cloudinary. The portfolio record was kept.");
    const { data: deleted, error: deleteError } = await db.from("portfolio_photos").delete().eq("id", id).eq("public_id", photo.public_id).select("id").maybeSingle();
    if (deleteError || !deleted) return reply(502, "File removed, but its portfolio record remains. Try deleting it again.");
    return reply(200, "Photo deleted from the portfolio and Cloudinary.");
  } catch { return reply(500, "Could not complete deletion. Check the portfolio before retrying."); }
});
