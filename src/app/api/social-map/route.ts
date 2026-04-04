import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const { routines, city, name } = await req.json();

    if (!routines || !Array.isArray(routines) || routines.length === 0) {
      return NextResponse.json(
        { error: "routines array is required" },
        { status: 400 }
      );
    }

    // Format the routines into a structured input for the AI
    const routineList = routines
      .map(
        (r: any, i: number) =>
          `${i + 1}. ${r.activity} — ${r.days} at ${r.time}, ${r.location || "no fixed location"} (${r.duration || "~1 hour"})`
      )
      .join("\n");

    const systemPrompt = `You are Lodge's Social Opportunity Engine. You do something no human can efficiently do: you analyze a person's entire weekly routine and identify the BEST moments to convert a solo activity into a shared ritual.

You are NOT suggesting activities. You are analyzing EXISTING activities and scoring them on how naturally they convert from solo to shared.

THE USER:
- Name: ${name || "User"}
- City: ${city || "Unknown"}
- Just moved here and does all of these alone.

THEIR WEEKLY ROUTINES:
${routineList}

YOUR TASK:
Analyze ALL routines together and rank the top 3-5 "social opportunity windows" — moments in their week where adding one other person would be:
1. EASIEST (lowest friction to invite someone)
2. MOST NATURAL (the activity already lends itself to shared participation)
3. MOST LIKELY TO STICK (the timing and cadence support habit formation)

For EACH opportunity, provide multi-factor reasoning that demonstrates genuine analysis:

SCORING FACTORS (weigh all of these):
- **Consistency score**: How regularly do they already do this? Daily > weekly > sporadic. Consistent routines convert better because the other person can rely on the schedule.
- **Activity compatibility**: How well does this activity work with 2 people vs. solo? Walking = great (natural conversation pace). Gym = moderate (can spot each other but often solo). Errands = low (different lists, different pace).
- **Time flexibility**: Morning routines have 2x higher attendance for new shared rituals (people cancel evening plans, not morning ones). Weekday mornings > weekend mornings > weekday evenings > weekend evenings.
- **Location sociability**: Does the location have natural conversation affordances? Parks and trails = high (walking pace, scenery prompts). Gyms = moderate (between sets). Grocery stores = low (task-focused).
- **Invitation ease**: How easy is it to frame this as a casual invite? "Come walk with me" = very easy. "Come watch me do errands" = awkward. Consider the framing copy difficulty.
- **Relationship acceleration**: Activities with mild shared challenge or novelty build bonds faster than passive ones. Cooking together > eating together. Hiking a new trail > walking a familiar one.

ALSO IDENTIFY:
- Which routine is the WORST candidate and why (this shows analytical depth)
- Any interesting COMBINATIONS (e.g., "your Tuesday walk and Thursday gym are close enough geographically that the same person could join both, creating a 2x/week cadence that accelerates friendship formation by ~3x compared to weekly")

Respond with valid JSON:
{
  "opportunities": [
    {
      "rank": 1,
      "routine_index": 0,
      "activity": "the activity name",
      "day_time": "when",
      "score": 92,
      "reasoning": "Multi-sentence explanation referencing specific scoring factors. This must feel like a SMART FRIEND analyzing your life, not a template. Reference the specific activity, time, location, and why THIS one ranks highest.",
      "framing_copy": "The exact casual invite text to send someone",
      "combo_potential": "If this pairs with another routine for accelerated bonding, explain how. Otherwise null.",
      "session_1": "Specific scaffolding for the first time doing this with a stranger — what to do, what to talk about, how to make it not awkward. Must be DIFFERENT based on activity type."
    }
  ],
  "worst_candidate": {
    "activity": "the activity",
    "reason": "Why this is the hardest to convert — demonstrates analytical depth"
  },
  "weekly_insight": "One sentence synthesizing the overall pattern — e.g., 'Your mornings are your social goldmine. You have 4 consistent morning routines but zero evening ones, which means your best strategy is a morning ritual partner, not a dinner buddy.'"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Analyze my weekly routines and find my best social opportunity windows. I just moved to ${city || "a new city"} and I do all of these alone. Where should I add a person?`,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    const socialMap = JSON.parse(content);

    return NextResponse.json({ socialMap });
  } catch (err) {
    console.error("Social map generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate social map" },
      { status: 500 }
    );
  }
}
