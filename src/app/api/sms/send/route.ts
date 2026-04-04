import { NextRequest, NextResponse } from "next/server";
import { twilioClient, twilioPhone } from "@/lib/twilio";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { gathering_id } = await req.json();

    if (!gathering_id) {
      return NextResponse.json(
        { error: "gathering_id is required" },
        { status: 400 }
      );
    }

    // Fetch gathering with lodge info
    const { data: gathering, error: gatheringError } = await supabase
      .from("gatherings")
      .select("*, lodges(*)")
      .eq("id", gathering_id)
      .single();

    if (gatheringError || !gathering) {
      return NextResponse.json(
        { error: "Gathering not found" },
        { status: 404 }
      );
    }

    // Fetch members
    const { data: members } = await supabase
      .from("members")
      .select("*")
      .eq("lodge_id", gathering.lodge_id);

    if (!members || members.length === 0) {
      return NextResponse.json({ error: "No members found" }, { status: 404 });
    }

    // Extract details and suggested time
    const details = gathering.details || "";
    const timeMatch = details.match(/Suggested time: (.+)/);
    const suggestedTime = timeMatch ? timeMatch[1] : "TBD";

    // Send SMS to each member
    const results = await Promise.allSettled(
      members.map(async (member) => {
        const message = `${gathering.lodges.name}: ${gathering.activity}\n\n${suggestedTime}\n\nYou in? Reply Y or N`;

        await twilioClient.messages.create({
          body: message,
          from: twilioPhone,
          to: member.phone,
        });

        return { member_id: member.id, status: "sent" };
      })
    );

    // Update gathering status to "invited"
    await supabase
      .from("gatherings")
      .update({ status: "invited" })
      .eq("id", gathering_id);

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({
      sent,
      failed,
      total: members.length,
    });
  } catch (err) {
    console.error("SMS send error:", err);
    return NextResponse.json(
      { error: "Failed to send SMS invites" },
      { status: 500 }
    );
  }
}
