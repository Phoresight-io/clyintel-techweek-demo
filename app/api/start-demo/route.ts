import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

function buildSystemPrompt(scenario: number, name: string, companyName: string): string {
  const base = `You are an AI collections agent for Clyintel. You are contacting ${name} regarding an outstanding invoice for ${companyName}. CRITICAL: Your entire reply MUST be 155 characters or fewer. Count carefully. Never exceed this limit.`;
  switch (scenario) {
    case 1:
      return `${base} Invoice is 7 days past due. Tone: warm, helpful. Include payment link placeholder [LINK]. Start with "Hi ${name},"`;
    case 2:
      return `${base} Invoice is 45 days past due. Tone: direct, urgent. Mention payment plan option. Start with "Hi ${name},"`;
    case 3:
      return `${base} Invoice is 90 days past due. Tone: serious, final notice. Escalation implied. Start with "Hi ${name},"`;
    default:
      return base;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, companyName, phone, scenario } = body as {
      firstName?: string;
      lastName?: string;
      companyName?: string;
      phone?: string;
      scenario?: number;
    };

    if (!firstName || !lastName || !companyName || !phone || !scenario || ![1, 2, 3].includes(scenario)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const name = `${firstName} ${lastName}`;
    const systemPrompt = buildSystemPrompt(scenario, name, companyName);

    // Call Anthropic API
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 150,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Send the opening recovery message to ${name} at ${companyName}.`,
          },
        ],
      }),
    });

    const anthropicStatus = anthropicRes.status;
    const anthropicBody = await anthropicRes.text();
    console.log(`[start-demo] anthropic=${anthropicStatus} key=${process.env.ANTHROPIC_API_KEY?.slice(0, 15)} body=${anthropicBody.slice(0, 200)}`);

    if (!anthropicRes.ok) {
      throw new Error(`Anthropic error: ${anthropicStatus} — ${anthropicBody}`);
    }

    const anthropicData = JSON.parse(anthropicBody) as {
      content: Array<{ type: string; text: string }>;
    };
    const aiMessage = (anthropicData.content[0]?.text ?? "").slice(0, 155);

    // Send SMS via Twilio
    const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN!;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER!;

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64")}`,
        },
        body: new URLSearchParams({ From: twilioFrom, To: phone, Body: aiMessage }),
      }
    );

    if (!twilioRes.ok) {
      const twilioErr = await twilioRes.text();
      throw new Error(`Twilio error: ${twilioRes.status} — ${twilioErr}`);
    }

    // Insert into Supabase
    const { error: dbError } = await (getSupabase() as any).from("demo_sessions").insert({
      name,
      company_name: companyName,
      phone,
      scenario,
      conversation_history: [
        { role: "agent", message: aiMessage, timestamp: new Date().toISOString() },
      ],
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[start-demo] Full error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: "Failed to start demo" }, { status: 500 });
  }
}
