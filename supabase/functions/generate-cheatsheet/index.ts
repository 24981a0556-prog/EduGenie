import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, unit, topics } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const topicList = (topics || []).join(', ');

    const prompt = `You are an expert academic tutor. Create a concise cheat sheet for quick exam revision.

Subject: ${subject}
Unit: ${unit}
Topics: ${topicList}

Generate the cheat sheet in EXACTLY this markdown format:

# 📋 Cheat Sheet: ${unit}

## 🗺️ Mind Map

Show a text-based mind map / tree structure of the unit. Use indentation and lines to show hierarchy.

\`\`\`
${unit}
├── [Main Topic 1]
│   ├── [Subtopic]
│   └── [Subtopic]
├── [Main Topic 2]
│   ├── [Subtopic]
│   └── [Subtopic]
└── [Main Topic 3]
    ├── [Subtopic]
    └── [Subtopic]
\`\`\`

## 📌 Topics with Key Points

For each topic, list the most important points in a compact format:

### [Topic Name]
- **[Key Concept]** → [One-line explanation]
- **[Key Concept]** → [One-line explanation]

(Repeat for ALL topics)

## ⚡ 1-Liner Revision Points

Provide 8-12 ultra-short, memorable one-liner summaries of the most important concepts. Each should be a single sentence that captures the essence.

- [Concept] = [One-line definition/explanation]
- [Concept] = [One-line definition/explanation]

Make it concise, memorable, and exam-focused. Every line should be something a student can quickly glance at before an exam.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic tutor that creates concise, exam-focused cheat sheets for quick revision." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ cheatsheet: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cheatsheet error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
