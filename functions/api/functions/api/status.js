// Cloudflare Pages Function: checks a fal.ai job and returns the video URL when done
const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

export async function onRequestPost({ request, env }) {
  if (request.headers.get("x-app-password") !== env.APP_PASSWORD) {
    return json({ error: "Wrong password" }, 401);
  }
  const { status_url, response_url } = await request.json().catch(() => ({}));
  const ok = (u) => typeof u === "string" && u.startsWith("https://queue.fal.run/");
  if (!ok(status_url) || !ok(response_url)) return json({ error: "Bad URL" }, 400);

  const headers = { Authorization: `Key ${env.FAL_KEY}` };
  const s = await fetch(status_url, { headers }).then((r) => r.json());

  if (s.status !== "COMPLETED") return json({ status: s.status, position: s.queue_position ?? null });

  const result = await fetch(response_url, { headers }).then((r) => r.json());
  const video = result?.video?.url;
  if (!video) return json({ status: "FAILED", error: "Finished but no video came back" });
  return json({ status: "COMPLETED", video });
}
