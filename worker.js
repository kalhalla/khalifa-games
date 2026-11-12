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
      const headers = new Headers();
      for (const k of ["content-type", "cache-control", "etag", "last-modified"]) {
        const v = upstream.headers.get(k);
        if (v) headers.set(k, v);
      }
      headers.set("x-forwarded-from", "rosso-di-mare");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    return env.ASSETS.fetch(request);
  },
};
