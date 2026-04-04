import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Lodge = {
  id: string;
  name: string;
  type: "keep" | "build";
  cadence: "weekly" | "biweekly" | "monthly";
  preferences: string[];
  keeper_name: string;
  keeper_phone: string;
  keeper_timezone: string;
  created_at: string;
};

export type Member = {
  id: string;
  lodge_id: string;
  name: string;
  phone: string;
  timezone: string;
  created_at: string;
};

export type Gathering = {
  id: string;
  lodge_id: string;
  activity: string;
  reasoning: string;
  details: string;
  alternatives: string[];
  scheduled_at: string;
  status: "draft" | "invited" | "completed";
  rating: number | null;
  feedback: string | null;
  created_at: string;
};

export type RSVP = {
  id: string;
  gathering_id: string;
  member_id: string;
  response: "yes" | "no" | "pending";
  responded_at: string | null;
};

export type RitualBlueprint = {
  id: string;
  lodge_id: string;
  routine: string;
  city: string;
  day_time: string;
  group_size: number;
  framing_copy: string;
  session_scaffolding: string[];
  created_at: string;
};
