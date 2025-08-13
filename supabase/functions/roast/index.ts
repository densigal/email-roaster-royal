// Supabase Edge Function: roast
// Uses Perplexity API with secret stored as PERPLEXITY_API_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders } });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { text } = await req.json().catch(() => ({ text: "" }));
    if (!text || String(text).trim().length < 20) {
      return new Response(JSON.stringify({ error: "Email text too short" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing PERPLEXITY_API_KEY secret" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const systemPrompt = "You are a brutal yet witty sales coach. Given a cold email, roast it mercilessly but with humor. Then offer actionable fixes. Return concise sections: 1) Roast (funny, punchy), 2) What to fix (bullet list), 3) Better subject lines (3), 4) TL;DR rewrite (3-5 sentences). Keep the total under 250 words. Avoid profanity.";

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 700,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: String(text) },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Perplexity error:", t);
      return new Response(JSON.stringify({ error: "Upstream error", details: t }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ roast: content }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
