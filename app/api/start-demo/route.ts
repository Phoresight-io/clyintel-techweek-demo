import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[start-demo] body:', JSON.stringify(body))
    const companyName = (body as any).companyName ?? (body as any).company ?? ''
    let scenario = (body as any).scenario
    if (scenario === '7d') scenario = 1
    else if (scenario === '45d') scenario = 2
    else if (scenario === '90d') scenario = 3
    const { firstName, lastName, email, phone, channel } = body as {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      channel?: string
    }

    if (!firstName || !lastName || !phone || !channel || !scenario) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if ((channel === 'Email' || channel === 'Both') && !email) {
      return NextResponse.json({ error: 'Email is required for this channel' }, { status: 400 })
    }
    const scenarioNum: number = typeof scenario === 'number' && [1, 2, 3].includes(scenario) ? scenario : 0
    if (!scenarioNum) {
      return NextResponse.json({ error: 'Invalid scenario' }, { status: 400 })
    }

    const name = `${firstName} ${lastName}`

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

    if (channel === 'Email') {
      await sendEmail()
    } else if (channel === 'Phone Call') {
      await sendPhoneCall()
    } else if (channel === 'Both') {
      await Promise.all([sendEmail(), sendPhoneCall()])
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[start-demo] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return NextResponse.json({ error: 'Failed to start demo' }, { status: 500 })
  }
}
