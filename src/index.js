import { DurableObject } from "cloudflare:workers";

// How long an "extinct" IP is remembered. Kept short on purpose (GDPR storage limitation).
const TTL_MS = 30 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

async function hmacHex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/* Stores only keyed hashes of IP addresses, never the addresses themselves.
   The secret salt is generated inside this object and never leaves it. */
export class Registry extends DurableObject {
  async salt() {
    let s = await this.ctx.storage.get("salt");
    if (!s) {
      s = crypto.randomUUID() + crypto.randomUUID();
      await this.ctx.storage.put("salt", s);
    }
    return s;
  }

  async run(op, ip) {
    const key = "h:" + (await hmacHex(await this.salt(), ip));
    const now = Date.now();
    if (op === "status") {
      const until = await this.ctx.storage.get(key);
      return { extinct: typeof until === "number" && until > now };
    }
    if (op === "mark") {
      await this.ctx.storage.put(key, now + TTL_MS);
      if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(now + DAY_MS);
      return { ok: true };
    }
    if (op === "forget") {
      await this.ctx.storage.delete(key);
      return { ok: true };
    }
    return { error: "unknown op" };
  }

  // Daily sweep that deletes expired hashes.
  async alarm() {
    const now = Date.now();
    const all = await this.ctx.storage.list({ prefix: "h:" });
    const expired = [];
    for (const [k, until] of all) if (until <= now) expired.push(k);
    for (let i = 0; i < expired.length; i += 128) await this.ctx.storage.delete(expired.slice(i, i + 128));
    if (all.size > expired.length) await this.ctx.storage.setAlarm(now + DAY_MS);
  }
}

const ROUTES = { "/api/status": "status", "/api/extinct": "mark", "/api/forget": "forget" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const op = ROUTES[url.pathname];
    if (!op) return json({ error: "not found" }, 404);
    if (op !== "status" && request.method !== "POST") return json({ error: "use POST" }, 405);
    const ip = request.headers.get("CF-Connecting-IP");
    if (!ip) return json(op === "status" ? { extinct: false } : { ok: false });
    const stub = env.REGISTRY.get(env.REGISTRY.idFromName("global"));
    return json(await stub.run(op, ip));
  },
};
