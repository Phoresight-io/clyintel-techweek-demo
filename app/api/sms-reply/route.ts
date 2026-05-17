import { NextRequest, NextResponse } from "next/server";
import { getSupabase, DemoSession, ConversationEntry } from "@/lib/supabase";

const SCENARIO_SUFFIX: Record<number, string> = {
  1: "The invoice is 7 days past due. Tone: warm and helpful. Offer the payment link if they ask.",
  2: "The invoice is 45 days past due. Tone: direct and urgent. A payment plan is available.",
  3: "The invoice is 90 days past due. Tone: serious, final notice. Escalation to collections is the next step.",
};

function twiml(message: string): NextResponse {
  return new NextResponse(`<Response><Message>${message}</Message></Response>`, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get("From") as string;
    const body = formData.get("Body") as string;

    // Look up most recent session for this phone number
    const { data: sessions, error: queryError } = await getSupabase()
      .from("demo_sessions")
      .select("*")
      .eq("phone", from)
      .order("created_at", { ascending: false })
      .limit(1);

    if (queryError) throw queryError;

    if (!sessions || sessions.length === 0) {
      return twiml("No active demo session found. Visit the demo page to start one.");
    }

    const session = sessions[0] as DemoSession;

    const newClientEntry: ConversationEntry = {
      role: "client",
      message: body,
      timestamp: new Date().toISOString(),
    };

    const updatedHistory: ConversationEntry[] = [
      ...session.conversation_history,
      newClientEntry,
    ];

    // Build Anthropic messages from history (including new client message)
    const messages = updatedHistory.map((entry) => ({
      role: entry.role === "client" ? "user" : "assistant",
      content: entry.message,
    }));

    const basePrompt = `You are an AI collections agent for Clyintel. You are texting ${session.name} about an overdue invoice. Keep all replies under 160 characters. Be conversational — this is SMS. Never break character. Do not explain that you are an AI.`;
    const systemPrompt = `${basePrompt} ${SCENARIO_SUFFIX[session.scenario]}`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 150,
        system: systemPrompt,
        messages,
      }),
    });

    if (!anthropicRes.ok) {
      throw new Error(`Anthropic error: ${anthropicRes.status}`);
    }

    const anthropicData = await anthropicRes.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const aiReply = anthropicData.content[0]?.text ?? "";

    const newAgentEntry: ConversationEntry = {
      role: "agent",
      message: aiReply,
      timestamp: new Date().toISOString(),
    };

    const finalHistory: ConversationEntry[] = [...updatedHistory, newAgentEntry];

    const { error: updateError } = await getSupabase()
      .from("demo_sessions")
      .update({
        conversation_history: finalHistory as unknown[],
        last_reply_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq("id", session.id);

    if (updateError) throw updateError;

    return twiml(aiReply);
  } catch (err) {
    console.error("[sms-reply]", err);
    return twiml("Something went wrong. Please try again.");
  }
}
