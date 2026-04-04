import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { lodge_id } = await req.json();

    if (!lodge_id) {
      return NextResponse.json(
        { error: "lodge_id is required" },
        { status: 400 }
      );
    }

    // Fetch lodge details
    const { data: lodge, error: lodgeError } = await supabase
      .from("lodges")
      .select("*")
      .eq("id", lodge_id)
      .single();

    if (lodgeError || !lodge) {
      return NextResponse.json({ error: "Lodge not found" }, { status: 404 });
    }

    // Fetch members
    const { data: members } = await supabase
      .from("members")
      .select("*")
      .eq("lodge_id", lodge_id);

    // Fetch past gatherings for context
    const { data: pastGatherings } = await supabase
      .from("gatherings")
      .select("activity, rating, feedback, scheduled_at")
      .eq("lodge_id", lodge_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const memberCount = members?.length || 0;
    const timezones = [
      ...new Set(members?.map((m) => m.timezone) || []),
    ];
    const pastContext =
      pastGatherings && pastGatherings.length > 0
        ? pastGatherings
            .map(
              (g) =>
                `- "${g.activity}" (${g.rating === 1 ? "thumbs up" : g.rating === -1 ? "thumbs down" : "no rating"}${g.feedback ? `, feedback: "${g.feedback}"` : ""})`
            )
            .join("\n")
        : "No past gatherings yet — this is their first one.";

    const systemPrompt = `You are Lodge's AI activity planner. Your job is to suggest the perfect activity for a recurring friend group gathering.

CONTEXT:
- Lodge name: "${lodge.name}"
- Type: ${lodge.type} (${lodge.type === "keep" ? "long-distance friends staying connected" : "new local group building shared rituals"})
- Group size: ${memberCount} people
- Cadence: ${lodge.cadence}
- Preferred activities: ${lodge.preferences.join(", ")}
- Timezones: ${timezones.join(", ")}
${lodge.type === "keep" ? "- This is a REMOTE group — suggest activities that work virtually across time zones." : "- This is a LOCAL group — suggest in-person activities."}

PAST GATHERINGS:
${pastContext}

RULES:
1. Be SPECIFIC — not "play a game" but "play Codenames on horsepaste.com — it works great for ${memberCount} players and takes ~45 min"
2. Always explain your REASONING — why this activity for THIS group right now. Reference past attendance patterns or preferences.
3. Keep it casual and fun — this is friends hanging out, not a team-building exercise.
4. If the group has past gatherings, vary the suggestion. Don't repeat the same activity twice in a row.
5. Include practical logistics: what platform/app to use, what to bring/prep, estimated duration.
6. Suggest 2 alternatives in case the Keeper wants to swap.

Respond with valid JSON only, no markdown:
{
  "activity": "The main activity suggestion (1-2 sentences)",
  "reasoning": "Why you're suggesting this for this specific group (2-3 sentences). Reference their preferences, group size, or past patterns. This reasoning is SHOWN to the Keeper — make it feel like a smart friend giving advice, not an algorithm.",
  "details": "Practical logistics: platform, duration, what to prep (2-3 sentences)",
  "alternatives": ["Alternative 1 (1 sentence)", "Alternative 2 (1 sentence)"],
  "suggested_time": "A suggested day/time that works across their timezones (e.g., 'Saturday 8pm ET / 6pm MT')"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate the next gathering activity for "${lodge.name}". Make it specific, fun, and explain your reasoning.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const suggestion = JSON.parse(content);

    // Save as a draft gathering
    const { data: gathering, error: gatheringError } = await supabase
      .from("gatherings")
      .insert({
        lodge_id,
        activity: suggestion.activity,
        reasoning: suggestion.reasoning,
        details: `${suggestion.details}\n\nSuggested time: ${suggestion.suggested_time}`,
        alternatives: suggestion.alternatives,
        status: "draft",
      })
      .select()
      .single();

    if (gatheringError) {
      return NextResponse.json(
        { error: "Failed to save gathering" },
        { status: 500 }
      );
    }

    // Create pending RSVPs for all members
    if (members && members.length > 0) {
      const rsvpRows = members.map((m) => ({
        gathering_id: gathering.id,
        member_id: m.id,
        response: "pending" as const,
      }));

      await supabase.from("rsvps").insert(rsvpRows);
    }

    return NextResponse.json({
      gathering,
      suggestion,
    });
  } catch (err) {
    console.error("Activity generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate activity" },
      { status: 500 }
    );
  }
}
