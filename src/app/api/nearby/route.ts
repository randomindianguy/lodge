import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lng = parseFloat(searchParams.get("lng") || "0");
    const lat = parseFloat(searchParams.get("lat") || "0");

    if (!lng || !lat) {
      return NextResponse.json(
        { error: "lng and lat are required" },
        { status: 400 }
      );
    }

    // Fetch all ritual blueprints with coordinates
    // Simple bounding box query (~10 mile radius at mid-latitudes)
    const delta = 0.15; // roughly 10 miles
    const { data: blueprints, error } = await supabase
      .from("ritual_blueprints")
      .select("*, lodges(name, keeper_name)")
      .not("lng", "is", null)
      .not("lat", "is", null)
      .gte("lng", lng - delta)
      .lte("lng", lng + delta)
      .gte("lat", lat - delta)
      .lte("lat", lat + delta)
      .limit(20);

    if (error) throw error;

    return NextResponse.json({ blueprints: blueprints || [] });
  } catch (err) {
    console.error("Nearby query error:", err);
    return NextResponse.json(
      { error: "Failed to fetch nearby rituals" },
      { status: 500 }
    );
  }
}
