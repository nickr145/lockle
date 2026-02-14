import { createClient } from "@supabase/supabase-js";
import { getDeviceId } from "./game/device";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function submitScore(day: string, moves: number) {
  const device_id = getDeviceId();

  const { data, error } = await supabase
    .from("submissions")
    .upsert(
      { day, device_id, moves },
      { onConflict: "day,device_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Error submitting score:", error);
    throw error;
  }

  return data;
}
