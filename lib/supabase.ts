import { createClient } from "@supabase/supabase-js";

export type DemoSession = {
  id: string;
  first_name: string;
  phone: string;
  scenario_days: 7 | 45 | 90;
  created_at: string;
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
