import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getSupabase } from "@/lib/supabase";

const SYSTEM_PROMPT = `You are a professional AI collections agent for Clyintel, recovering outstanding invoice payments on behalf of small businesses. Be firm but respectful. You may offer a discount of up to 20% as goodwill — never more. Always calculate and state the discounted amount explicitly (e.g. "20% off $15,200 brings your balance to $12,160"). If the client requests a human or is hostile, include that someone will be in contact. Tone: 1-14 days overdue = friendly. 15-30 days = firm. 31-60 days = serious. 60+ = final notice. Respond in plain conversational text only — no JSON, no markdown. If asked something you don't know (e.g. specific account history, previous payments, internal notes), say: "I don't have that detail in front of me right now — let me have someone from our team follow up with you on that specifically." Do not make up information.`;

const INVOICE_CONTEXT: Record<number, string> = {
  1: `Invoice #: INV-2024-0891
Amount: $2,400.00
Due date: May 10, 2026
Days past due: 7
Client: MVP Supplies
Business collecting: Boston Tech Week
Payment link: https://pay.clyintel.com/demo
Discounted amount (20% off): $1,920.00`,

  2: `Invoice #: INV-2024-0744
Amount: $8,750.00
Due date: April 3, 2026
Days past due: 45
Client: MVP Supplies
Business collecting: Boston Tech Week
Payment link: https://pay.clyintel.com/demo
Discounted amount (20% off): $7,000.00`,

  3: `Invoice #: INV-2024-0612
Amount: $15,200.00
Due date: February 17, 2026
Days past due: 90
Client: MVP Supplies
Business collecting: Boston Tech Week
Payment link: https://pay.clyintel.com/demo
Discounted amount (20% off): $12,160.00`,
};

async function getScenarioForSender(senderEmail: string): Promise<number> {
  try {
    const { data } = await (getSupabase() as any)
      .from("demo_sessions")
      .select("scenario")
      .eq("email", senderEmail)
      .order("created_at", { ascending: false })
      .limit(1);
    return data?.[0]?.scenario ?? 3;
  } catch {
    return 3;
  }
}

async function processEmailReply(payload: unknown) {
  try {
    const data = (payload as any)?.data ?? payload;
    const senderEmail: string = data?.sender?.email ?? "";
    const senderName: string = data?.sender?.name ?? "";
    const emailText: string = data?.text ?? "";
    const subject: string = data?.subject ?? "";
    const inReplyTo: string = data?.message?.id ?? data?.in_reply_to ?? "";

    if (!senderEmail || !emailText) {
      console.log("[email-reply] missing fields — senderEmail:", senderEmail, "emailText length:", emailText.length);
      return;
    }

    const scenario = await getScenarioForSender(senderEmail);
    const invoiceContext = INVOICE_CONTEXT[scenario] ?? INVOICE_CONTEXT[3];
    const systemPrompt = `${SYSTEM_PROMPT}\n\nInvoice context for this conversation:\n${invoiceContext}`;

    // Generate reply with Anthropic
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: emailText }],
      }),
    });

    if (!anthropicRes.ok) {
      const err = await anthropicRes.text();
      throw new Error(`Anthropic error: ${anthropicRes.status} — ${err}`);
    }

    const anthropicData = await anthropicRes.json() as {
      content: Array<{ type: string; text: string }>;
    };
    const aiReply = anthropicData.content[0]?.text ?? "";

    // Build MailerSend payload
    const mailerPayload: Record<string, unknown> = {
      from: { email: "team@phoresight.io", name: "Clyintel Collections" },
      reply_to: { email: "ydfcveq0xfihgfgz5r4q@inbound.mailersend.net", name: "Clyintel Collections" },
      to: [{ email: senderEmail, name: senderName }],
      subject: `Re: ${subject}`,
      text: aiReply,
      html: `<p>${aiReply.replace(/\n/g, "<br>")}</p>`,
    };

    if (inReplyTo) {
      mailerPayload.headers = [
        { name: "In-Reply-To", value: inReplyTo },
        { name: "References", value: inReplyTo },
      ];
    }

    // Send reply via MailerSend
    const mailerRes = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MAILERSEND_API_KEY!}`,
      },
      body: JSON.stringify(mailerPayload),
    });

    if (!mailerRes.ok) {
      const err = await mailerRes.text();
      throw new Error(`MailerSend error: ${mailerRes.status} — ${err}`);
    }

    console.log("[email-reply] reply sent to", senderEmail, "scenario", scenario);
  } catch (err) {
    console.error("[email-reply] error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.json();
  console.log("[email-reply] payload:", JSON.stringify(payload).slice(0, 500));

  // Acknowledge immediately so MailerSend doesn't retry
  waitUntil(processEmailReply(payload));
  return NextResponse.json({ ok: true }, { status: 200 });
}
