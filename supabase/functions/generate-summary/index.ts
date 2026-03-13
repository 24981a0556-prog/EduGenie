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

    const topicList = (topics || []).map((t: any) => {
      if (typeof t === 'string') return t;
      return `${t.name}${t.summary ? ` - ${t.summary}` : ''}${t.key_points?.length ? ` (Key points: ${t.key_points.join(', ')})` : ''}${t.formulas?.length ? ` (Formulas: ${t.formulas.join(', ')})` : ''}${t.concepts?.length ? ` (Concepts: ${t.concepts.join(', ')})` : ''}`;
    }).join('\n- ');

    const prompt = `You are an expert academic tutor. Generate a comprehensive, structured unit summary for exam preparation.

Subject: ${subject}
Unit: ${unit}
Topics in this unit:
- ${topicList}

Generate the summary in EXACTLY this markdown format. Follow every section precisely:

# ${unit}

## Topics Covered in This Unit
List ALL topics as bullet points.
- Topic 1
- Topic 2
- ...

## Key Points with Explanation
For EACH important concept in the unit, create a separate sub-heading and explanation. Cover every major concept thoroughly.

### KEY POINT: [Concept Name]
**Explanation:** A clear, detailed 2-3 line explanation of this concept. Make it easy to understand for a college student.

### KEY POINT: [Next Concept Name]
**Explanation:** Another clear 2-3 line explanation.

(Repeat for ALL key concepts — aim for at least 5-8 key points)

## Important Formulas / Conditions
List any relevant formulas, conditions, theorems, or rules in a numbered list. Show each formula clearly.
If none apply, write "No specific formulas for this unit."

1. Formula/Condition 1
2. Formula/Condition 2

## Examples
Provide 2-3 simple, concrete conceptual examples that help students understand the topic. Each example should be a short scenario or illustration.

**Example 1:**
[Describe a clear scenario]

**Example 2:**
[Describe another scenario]

## Exam Tips
Provide 4-5 short, actionable exam-oriented tips specific to this unit as bullet points.
- Tip 1
- Tip 2

Make the content detailed, accurate, and exam-focused. Use clear language suitable for college students. Be thorough with key points — cover every important concept in the unit.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert academic tutor that creates detailed, structured study summaries for exam preparation." },
          { role: "user", content: prompt },
        ],
        stream: true,
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

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
