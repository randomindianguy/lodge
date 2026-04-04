import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Twilio sends form-encoded data
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = (formData.get("Body") as string || "").trim().toLowerCase();

    if (!from || !body) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // Normalize phone: strip spaces, dashes
    const normalizedPhone = from.replace(/[\s-()]/g, "");

    // Find the member by phone number
    const { data: members } = await supabase
      .from("members")
      .select("id, lodge_id, name")
      .or(`phone.eq.${normalizedPhone},phone.eq.${from}`);

    if (!members || members.length === 0) {
      // Unknown number — respond gracefully
      return twimlResponse(
        "Hey! We don't recognize this number. Ask your friend to add you to their Lodge."
      );
    }

    // Parse response: Y/yes/yeah/yep → yes, N/no/nah/nope → no
    let response: "yes" | "no" | null = null;
    if (/^(y|yes|yeah|yep|yea|sure|ok|down|in)$/i.test(body)) {
      response = "yes";
    } else if (/^(n|no|nah|nope|nay|out|pass|skip)$/i.test(body)) {
      response = "no";
    }

    if (!response) {
      return twimlResponse("Reply Y to confirm or N to skip!");
    }

    // Find the most recent pending RSVP for this member
    for (const member of members) {
      const { data: rsvps } = await supabase
        .from("rsvps")
        .select("id, gathering_id")
        .eq("member_id", member.id)
        .eq("response", "pending")
        .order("id", { ascending: false })
        .limit(1);

      if (rsvps && rsvps.length > 0) {
        await supabase
          .from("rsvps")
          .update({
            response,
            responded_at: new Date().toISOString(),
          })
          .eq("id", rsvps[0].id);

        const replyText =
          response === "yes"
            ? `You're in! See you there. 🤙`
            : `No worries, catch you next time.`;

        return twimlResponse(replyText);
      }
    }

    return twimlResponse("No pending invites for you right now!");
  } catch (err) {
    console.error("Webhook error:", err);
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}

function twimlResponse(message: string) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
