import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Cache-Control": "no-store" };
const reply = (status: number, message: string) => new Response(JSON.stringify({ message }), { status, headers: { ...cors, "Content-Type": "application/json" } });
async function sign(params: Record<string, string>, secret: string) {
  const text = Object.entries(params).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&") + secret;
  const hash = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}
Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return reply(405, "Method not allowed");
  const authorization = request.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL"), anon = Deno.env.get("SUPABASE_ANON_KEY");
  const cloud = Deno.env.get("CLOUDINARY_CLOUD_NAME"), key = Deno.env.get("CLOUDINARY_API_KEY"), secret = Deno.env.get("CLOUDINARY_API_SECRET");
  if (!authorization?.startsWith("Bearer ")) return reply(401, "Login required");
  if (!url || !anon || !cloud || !key || !secret) return reply(503, "Server configuration is incomplete");
  const db = createClient(url, anon, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } });
  const { data: { user }, error: authError } = await db.auth.getUser();
  if (authError || !user) return reply(401, "Login required");
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "admin") return reply(403, "Admin access required");
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) return reply(400, "A JPEG, PNG, or WebP up to 10 MB is required.");
    const publicId = `snapsmart/portfolio/${crypto.randomUUID()}`;
    const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)), type: "upload" };
    const payload = new FormData();
    payload.set("file", file); payload.set("api_key", key); payload.set("signature", await sign(params, secret));
    for (const [name, value] of Object.entries(params)) payload.set(name, value);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/upload`, { method: "POST", body: payload });
    if (!response.ok) return reply(502, "Cloudinary upload failed. Check account limits and try again.");
    const result = await response.json();
    if (result.public_id !== publicId || result.type !== "upload" || typeof result.secure_url !== "string" || !result.secure_url.startsWith(`https://res.cloudinary.com/${cloud}/`)) return reply(502, "Cloudinary returned an unexpected response; contact the administrator.");
    const { error } = await db.from("portfolio_photos").insert({ title: "Portfolio photo", public_id: publicId, image_url: result.secure_url });
    if (error) {
      const destroyParams = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)), type: "upload" };
      const cleanup = new URLSearchParams({ ...destroyParams, api_key: key, signature: await sign(destroyParams, secret) });
      const deleted = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/destroy`, { method: "POST", body: cleanup });
      return reply(502, deleted.ok ? "Could not save the portfolio record; upload was removed." : "Could not save the portfolio record or clean up the upload. Check Cloudinary Media Library.");
    }
    return reply(200, "Portfolio photo uploaded and published.");
  } catch { return reply(500, "Could not complete the upload. Check the portfolio and Cloudinary Media Library before retrying."); }
});
