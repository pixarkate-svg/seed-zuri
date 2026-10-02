https://github.com/pixarkate-svg/seed-zuri/tree/main // Cloudflare Pages Function: submits a video job to fal.ai (key stays secret on the server)
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestPost({ request, env }) {
  if (request.headers.get("x-app-password") !== env.APP_PASSWORD) {
    return json({ error: "Wrong password" }, 401);
  }
  let body;
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  const prompt = String(body.prompt || "").slice(0, 2000);
  if (!prompt) return json({ error: "Write a prompt first" }, 400);

  // Clamp options so a typo can't burn your credits
  const aspect_ratio = ["9:16", "16:9", "1:1"].includes(body.aspect_ratio) ? body.aspect_ratio : "9:16";
  const duration = ["5", "10"].includes(String(body.duration)) ? String(body.duration) : "5";
  const resolution = ["480p", "720p"].includes(body.resolution) ? body.resolution : "720p";

  // Copy the exact model ID from the Seedance page on fal.ai if this one is outdated
  const model = env.FAL_MODEL || "fal-ai/bytedance/seedance/v1/pro/text-to-video";

  const r = await fetch(`https://queue.fal.run/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${env.FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspect_ratio, duration, resolution }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return json({ error: data.detail || data.error || "fal.ai rejected the request" }, r.status);
  return json({ status_url: data.status_url, response_url: data.response_url });
}
