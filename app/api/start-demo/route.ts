import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const SYSTEM_PROMPTS: Record<number, string> = {
  1: "You are an AI collections agent for Clyintel. The client is 7 days past due. Tone: warm, professional, helpful. This is a first touch. Include a payment link placeholder [PAYMENT_LINK]. Keep it under 160 characters. Start with \"Hi [NAME],\"",
  2: "You are an AI collections agent for Clyintel. The client is 45 days past due. Tone: direct, urgent, but not hostile. Offer a payment plan. Keep it under 160 characters. Start with \"Hi [NAME],\"",
  3: "You are an AI collections agent for Clyintel. The client is 90 days past due. Tone: serious, final notice language, escalation implied. Keep it under 160 characters. Start with \"Hi [NAME],\"",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, scenario } = body as {
      name?: string;
      phone?: string;
      scenario?: number;
    };

    if (!name || !phone || !scenario || ![1, 2, 3].includes(scenario)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    // Call Anthropic API
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
        system: SYSTEM_PROMPTS[scenario],
        messages: [
          {
            role: "user",
            content: `Send the opening recovery message to ${name}. Replace [NAME] with their actual name.`,
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      throw new Error(`Anthropic error: ${anthropicRes.status}`);
    }

    const anthropicData = await anthropicRes.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const aiMessage = anthropicData.content[0]?.text ?? "";

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
      throw new Error(`Twilio error: ${twilioRes.status}`);
    }

    // Insert into Supabase
    const { error: dbError } = await (getSupabase() as any).from("demo_sessions").insert({
      name,
      phone,
      scenario,
      conversation_history: [
        { role: "agent", message: aiMessage, timestamp: new Date().toISOString() },
      ],
    });

    if (dbError) throw dbError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[start-demo]", err);
    return NextResponse.json({ error: "Failed to start demo" }, { status: 500 });
  }
}
