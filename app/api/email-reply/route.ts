import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a professional AI collections agent for Clyintel, recovering outstanding invoice payments on behalf of small businesses. Be firm but respectful. You may offer a discount of up to 20% as goodwill — never more. If the client requests a human or is hostile, include that someone will be in contact. Tone: 1-14 days overdue = friendly. 15-30 days = firm. 31-60 days = serious. 60+ = final notice. Respond in plain conversational text only — no JSON, no markdown.`;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log("[email-reply] payload:", JSON.stringify(payload).slice(0, 500));

    const data = payload?.data ?? payload;
    const senderEmail: string = data?.sender?.email ?? "";
    const senderName: string = data?.sender?.name ?? "";
    const emailText: string = data?.text ?? "";
    const subject: string = data?.subject ?? "";

    if (!senderEmail || !emailText) {
      console.log("[email-reply] missing fields — senderEmail:", senderEmail, "emailText length:", emailText.length);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

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
        system: SYSTEM_PROMPT,
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

    // Send reply via MailerSend
    const mailerRes = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MAILERSEND_API_KEY!}`,
      },
      body: JSON.stringify({
        from: { email: "team@phoresight.io", name: "Clyintel Collections" },
        reply_to: { email: "ydfcveq0xfihgfgz5r4q@inbound.mailersend.net", name: "Clyintel Collections" },
        to: [{ email: senderEmail, name: senderName }],
        subject: `Re: ${subject}`,
        text: aiReply,
        html: `<p>${aiReply.replace(/\n/g, "<br>")}</p>`,
      }),
    });

    if (!mailerRes.ok) {
      const err = await mailerRes.text();
      throw new Error(`MailerSend error: ${mailerRes.status} — ${err}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[email-reply] error:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
    return NextResponse.json({ error: "Failed to process email reply" }, { status: 500 });
  }
}
