import { NextResponse } from 'next/server'

const AIRTABLE_BASE = 'appO4LGpzeTzRdQcV'
const AIRTABLE_TABLE = 'tblmrGhVe1lfFmDog'

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json()

    const spaceIdx = (name as string).indexOf(' ')
    const firstName = spaceIdx === -1 ? name : name.slice(0, spaceIdx)
    const lastName = spaceIdx === -1 ? '' : name.slice(spaceIdx + 1)

    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        },
        body: JSON.stringify({
          typecast: true,
          fields: {
            fldEPXRzqIDSsCAN4: firstName,
            fldqEHRkc1OG4dbce: lastName,
            fldzsOOepijnOgsM8: email,
            fldY0yP6F2TtynxRR: 'Boston Tech Week 26',
            fldgkTnFTSCrX4aid: 'Boston Tech Week 26',
            fldxd6PifbbV7ljwW: new Date().toISOString(),
          },
        }),
      }
    )

    if (!res.ok) {
      const body = await res.text()
      console.error('Airtable error', res.status, body)
      return NextResponse.json({ error: 'Airtable error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Waitlist route error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
