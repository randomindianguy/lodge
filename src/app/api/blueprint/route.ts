import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { routine, city, day_time, group_size, keeper_name, keeper_phone } =
      await req.json();

    if (!routine || !city || !day_time) {
      return NextResponse.json(
        { error: "routine, city, and day_time are required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Lodge's Ritual Blueprint AI. Your job is to convert a solo routine into a shared ritual that feels natural, low-stakes, and repeatable.

CONTEXT:
- The user just moved to ${city} and currently does "${routine}" alone.
- They want to do it with ${group_size || 2} people, ${day_time}.
- This is NOT an event. It's a ROUTINE — the same mundane thing, same time, same people, every week.

RULES:
1. The framing copy should be casual and low-pressure. "Come walk with me Tuesday morning" NOT "Join my friendship group." The invite should feel like something you'd text a coworker, not post on a dating app.
2. Generate scaffolding for the first 3 sessions — what to do/talk about so it's not awkward with someone you barely know. Session 1 should be the easiest ask. Session 3 should feel like a habit forming.
3. The ritual should feel like something that ALREADY happens, not something new being organized. You're adding a person to an existing routine, not creating an event.
4. Be specific to the city — mention a real neighborhood, park, gym chain, or coffee shop that fits.

Respond with valid JSON only:
{
  "framing_copy": "The casual invite text — 1-2 sentences max. This is what the user sends to the person they want to invite.",
  "ritual_name": "A short name for this ritual (e.g., 'Tuesday Morning Walk' or 'Sunday Cook Club')",
  "description": "A 2-3 sentence description of what this shared ritual looks like in practice.",
  "location_suggestion": "A specific location in ${city} that fits (park, gym, cafe, etc.)",
  "session_scaffolding": [
    "Session 1: [specific, low-stakes activity/conversation starter for the first time]",
    "Session 2: [slightly more personal, building on session 1]",
    "Session 3: [by now it should feel like 'our thing' — what makes it stick]"
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Create a Ritual Blueprint for someone who ${routine} in ${city}, ${day_time}. Group size: ${group_size || 2}.`,
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

    const blueprint = JSON.parse(content);

    // Create a Build-type lodge
    const { data: lodge, error: lodgeError } = await supabase
      .from("lodges")
      .insert({
        name: blueprint.ritual_name,
        type: "build",
        cadence: "weekly",
        preferences: [routine],
        keeper_name: keeper_name || "Keeper",
        keeper_phone: keeper_phone || "",
        keeper_timezone:
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "America/New_York",
      })
      .select()
      .single();

    if (lodgeError) throw lodgeError;

    // Save the blueprint
    const { data: savedBlueprint, error: bpError } = await supabase
      .from("ritual_blueprints")
      .insert({
        lodge_id: lodge.id,
        routine,
        city,
        day_time,
        group_size: group_size || 2,
        framing_copy: blueprint.framing_copy,
        session_scaffolding: blueprint.session_scaffolding,
      })
      .select()
      .single();

    if (bpError) throw bpError;

    return NextResponse.json({
      lodge,
      blueprint: {
        ...blueprint,
        id: savedBlueprint.id,
        lodge_id: lodge.id,
      },
    });
  } catch (err) {
    console.error("Blueprint generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate blueprint" },
      { status: 500 }
    );
  }
}
