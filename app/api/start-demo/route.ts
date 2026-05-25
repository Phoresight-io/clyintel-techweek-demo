import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import twilio from 'twilio'

const SCENARIO_MAP: Record<string, number> = { '7d': 1, '45d': 2, '90d': 3 }

const OPENING_SMS: Record<number, string> = {
  1: "Hi {{firstName}}, MVP Supplies has invoice INV-2024-0891 past due. Pay here: https://pay.clyintel.com/demo — we're here to help.",
  2: "Hi {{firstName}}, MVP Supplies has invoice INV-2024-0744 45 days past due. Pay now: https://pay.clyintel.com/demo — reply and we'll work it out.",
  3: "Hi {{firstName}}, final notice — MVP Supplies has invoice INV-2024-0612 90 days past due. Remit immediately: https://pay.clyintel.com/demo — reply before this escalates.",
}

const INVOICE_NUMBER: Record<number, string> = {
  1: 'INV-2024-0891',
  2: 'INV-2024-0744',
  3: 'INV-2024-0612',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, company, email, phone, channel, scenario } = body as {
      firstName?: string
      lastName?: string
      company?: string
      email?: string
      phone?: string
      channel?: string
      scenario?: string
    }

    if (!firstName || !lastName || !phone || !channel || !scenario) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if ((channel === 'Email' || channel === 'Both') && !email) {
      return NextResponse.json({ error: 'Email is required for this channel' }, { status: 400 })
    }
    const scenarioNum = SCENARIO_MAP[scenario]
    if (!scenarioNum) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }

    const name = `${firstName} ${lastName}`
    const companyName = company ?? ''

    const { error: dbError } = await (getSupabase() as any).from('demo_sessions').insert({
      name,
      company_name: companyName,
      phone,
      scenario: scenarioNum,
      conversation_history: [],
    })
    if (dbError) throw dbError

    const daysPastDue = scenarioNum === 1 ? '7' : scenarioNum === 2 ? '45' : '90'
    const tone = scenarioNum === 1 ? 'warm and helpful' : scenarioNum === 2 ? 'direct and urgent' : 'serious, final notice'
    const emailSubject =
      scenarioNum === 1 ? 'A quick note about your invoice'
      : scenarioNum === 2 ? 'Your invoice needs attention'
      : 'Final notice — invoice overdue 90 days'

    const sendEmail = async () => {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: `You are an AI collections agent for Clyintel writing a professional recovery email to ${name} at ${companyName}. The invoice is ${daysPastDue} days past due. Tone: ${tone}. Write a concise email body only — no subject line, no greeting header, under 200 words.`,
          messages: [{ role: 'user', content: 'Write the recovery email.' }],
        }),
      })
      if (!anthropicRes.ok) {
        const txt = await anthropicRes.text()
        throw new Error(`Anthropic error: ${anthropicRes.status} — ${txt}`)
      }
      const anthropicData = await anthropicRes.json() as { content: Array<{ type: string; text: string }> }
      const aiEmailBody = anthropicData.content[0]?.text ?? ''

      const mailerRes = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: { email: process.env.MAILERSEND_FROM_EMAIL, name: 'Alex from Clyintel' },
          to: [{ email, name }],
          subject: emailSubject,
          text: aiEmailBody,
        }),
      })
      if (!mailerRes.ok) {
        const txt = await mailerRes.text()
        throw new Error(`MailerSend error: ${mailerRes.status} — ${txt}`)
      }
    }

    const sendPhoneCall = async () => {
      const vapiRes = await fetch('https://api.vapi.ai/call/phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
        body: JSON.stringify({
          assistantId: process.env.VAPI_ASSISTANT_ID,
          phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
          customer: { number: phone },
          assistantOverrides: {
            variableValues: { name, companyName, scenario: scenarioNum },
          },
        }),
      })
      if (!vapiRes.ok) {
        const txt = await vapiRes.text()
        throw new Error(`Vapi error: ${vapiRes.status} — ${txt}`)
      }
    }

    const sendSMS = async (to: string, name: string, scenarioNum: number) => {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      const body = OPENING_SMS[scenarioNum].replace('{{firstName}}', name.split(' ')[0]);
      await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER!,
        to,
      });
    };

    if (channel === 'Email') {
      await sendEmail()
    } else if (channel === 'Phone Call') {
      await sendPhoneCall()
    } else if (channel === 'SMS') {
      await sendSMS(phone, name, scenarioNum)
      await (getSupabase() as any).from('communications').insert({
        channel: 'sms',
        direction: 'outbound',
        subject: `Opening SMS — ${INVOICE_NUMBER[scenarioNum]}`,
        body: OPENING_SMS[scenarioNum].replace('{{firstName}}', name.split(' ')[0]),
        sent_at: new Date().toISOString(),
        status: 'sent',
        to_address: phone,
        from_address: process.env.TWILIO_PHONE_NUMBER!,
        airtable_subscriber_id: 'demo',
      })
    } else if (channel === 'Both') {
      await Promise.all([
        sendPhoneCall(),
        sendSMS(phone, name, scenarioNum),
      ])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[start-demo] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return NextResponse.json({ error: 'Failed to start demo' }, { status: 500 })
  }
}
