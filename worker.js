// Runs only for /rosso-di-mare (see run_worker_first in wrangler.jsonc).
// The game lives in its own repo and deployment; this forwards the path to it
// so updating the game never touches this site. Everything else is static files.
const GAME = "https://rosso-di-mare.vercel.app";
const PREFIX = "/rosso-di-mare";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === PREFIX) {
      url.pathname = PREFIX + "/";
      return Response.redirect(url.toString(), 301);
    }

    if (p === PREFIX + "/__probe") {
      const out = [];
      for (const ua of ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36", ""]) {
        try {
          const r = await fetch(GAME + "/", { headers: ua ? { "user-agent": ua, accept: "text/html" } : { accept: "text/html" } });
          const t = await r.text();
          out.push("ua=" + (ua ? "browser" : "none") + " status=" + r.status + " server=" + r.headers.get("server") + " mitigated=" + r.headers.get("x-vercel-mitigated") + " len=" + t.length + " head=" + t.slice(0, 160).replace(/\s+/g, " "));
        } catch (e) { out.push("ua=" + (ua ? "browser" : "none") + " threw " + e); }
      }
      return new Response("<!doctype html><title>probe</title><pre>" + out.join("\n").replace(/</g, "&lt;") + "</pre>", { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }

    if (p.startsWith(PREFIX + "/")) {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed", { status: 405 });
      }
      const target = GAME + p.slice(PREFIX.length) + url.search;
      let upstream;
      try {
        upstream = await fetch(target, {
          method: request.method,
          headers: {
            accept: request.headers.get("accept") || "*/*",
            "accept-language": request.headers.get("accept-language") || "en",
            "user-agent": request.headers.get("user-agent") || "khalifa-games-forwarder",
          },
          redirect: "follow",
        });
      } catch (err) {
        return new Response("The game is not reachable just now. Try again shortly.", {
          status: 502,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }
      const headers = new Headers(upstream.headers);
      headers.delete("set-cookie");
      headers.delete("x-robots-tag");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    return env.ASSETS.fetch(request);
  },
};
