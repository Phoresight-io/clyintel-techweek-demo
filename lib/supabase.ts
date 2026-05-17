import { createClient } from "@supabase/supabase-js";

export type ConversationEntry = {
  role: "agent" | "client";
  message: string;
  timestamp: string;
};

export type DemoSession = {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  scenario: 1 | 2 | 3;
  conversation_history: ConversationEntry[];
  created_at: string;
  last_reply_at: string | null;
};

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  return (_client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  ));
}
