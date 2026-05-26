'use client'

import { useState, useEffect, useRef } from 'react'

const C = {
  bg: '#EEF2F7', bgAlt: '#FFFFFF', card: '#FFFFFF',
  border: 'rgba(15,23,42,0.09)',
  shadow: '0 2px 16px rgba(15,23,42,0.07)',
  shadowMd: '0 4px 32px rgba(15,23,42,0.10)',
  blue: '#2563EB', blueDim: 'rgba(37,99,235,0.08)',
  purple: '#7C3AED', purpleDim: 'rgba(124,58,237,0.07)',
  gold: '#D97706', goldDim: 'rgba(217,119,6,0.08)',
  orange: '#EA580C', orangeDim: 'rgba(234,88,12,0.08)',
  red: '#DC2626', redDim: 'rgba(220,38,38,0.08)',
  green: '#059669', greenDim: 'rgba(5,150,105,0.08)',
  text: '#0F172A', muted: '#475569', dim: '#94A3B8',
}

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
}

const SCENARIOS = [
  { id: '7d', label: '7 Days Overdue', desc: 'Friendly reminder. Payment slightly overdue.', tag: 'LATE REMINDER', color: C.gold, dim: C.goldDim, invoice: 'INV-2024-0891', amount: '$2,400.00' },
  { id: '45d', label: '45 Days Overdue', desc: 'Firm follow-up. Payment seriously overdue.', tag: 'ESCALATING', color: C.orange, dim: C.orangeDim, invoice: 'INV-2024-0744', amount: '$8,750.00' },
  { id: '90d', label: '90 Days Overdue', desc: 'Final notice. Escalation to collections is next.', tag: 'CRITICAL', color: C.red, dim: C.redDim, invoice: 'INV-2024-0612', amount: '$15,200.00' },
]

const PLANS = [
  {
    name: 'Free', price: 0, color: C.blue, dim: 'rgba(37,99,235,0.08)',
    bullets: ['Up to 1 client score/month', 'Email outreach only', 'AR dashboard', '22% revenue share on recoveries', 'Community support'],
  },
  {
    name: 'Starter', price: 29, color: '#1D4ED8', dim: 'rgba(29,78,216,0.08)',
    bullets: ['Up to 20 client scores/month', 'Email outreach — basic workflows', 'Risk flags', '18% revenue share on recoveries', 'Email + Chat support'],
  },
  {
    name: 'Plus', price: 79, color: '#1E3A8A', dim: 'rgba(30,58,138,0.08)',
    bullets: ['Unlimited client scores', 'Advanced multi-step workflows', 'Predictive delinquency insights', 'Payment plan creation', '12% revenue share on recoveries', 'Webhook support'],
  },
]

const FEATURES = [
  { icon: '⚡', title: 'AI-Powered Outreach', desc: 'Automated recovery sequences across email, SMS, and voice — triggered by days overdue, not manual effort.' },
  { icon: '🧠', title: 'AI-Prioritized Collections', desc: 'Every invoice ranked by recovery likelihood. Clyintel tells you exactly who to call, message, or escalate — in order.' },
  { icon: '🎯', title: 'Client Payment Risk Score', desc: 'Every client gets a payment risk score updated monthly so you always know who needs attention before they go past due.' },
  { icon: '📋', title: 'Smart Payment Terms', desc: 'Clyintel recommends the right payment terms for each client based on their payment history and risk profile — automatically.' },
  { icon: '📊', title: 'See Everything in One Place', desc: 'Invoice status, outreach history, and client risk in a single dashboard. No spreadsheets, no guesswork.' },
  { icon: '🔗', title: 'Works With Your Existing Tools', desc: 'Connects with the Invoice and A/R software you already use. No need to change your workflow to get started.' },
]

const SURVEY_Q3_OPTS = ['Email', 'Phone calls', 'Text', 'Software', 'Outsourced', 'When I get to it 😅', 'Mail letters']

const BG_MAP: Record<string, string> = {
  [C.blue]: C.blueDim,
  [C.gold]: C.goldDim,
  [C.orange]: C.orangeDim,
  [C.green]: C.greenDim,
  '#1D4ED8': 'rgba(29,78,216,0.08)',
  '#1E3A8A': 'rgba(30,58,138,0.08)',
  '#172554': 'rgba(23,37,84,0.08)',
}

function SectionTag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color, background: BG_MAP[color] ?? C.blueDim,
      padding: '4px 10px', borderRadius: 6, marginBottom: 14,
    }}>{label}</span>
  )
}

function PlanCard({ plan, onCta }: { plan: typeof PLANS[0]; onCta: () => void }) {
  return (
    <div style={{
      background: C.card, borderRadius: 20, padding: '28px 24px',
      border: `1.5px solid ${C.border}`, boxShadow: C.shadow,
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: plan.dim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <div style={{ width: 16, height: 16, borderRadius: 4, background: plan.color }} />
      </div>
      <p style={{ fontWeight: 700, fontSize: 18, color: C.text, margin: '0 0 4px' }}>{plan.name}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '0 0 20px' }}>
        {plan.price === 0
          ? <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: C.text, lineHeight: 1 }}>Free</span>
          : <>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: C.text, lineHeight: 1 }}>${plan.price}</span>
            <span style={{ fontSize: 14, color: C.dim }}>/mo</span>
          </>}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {plan.bullets.map(b => (
          <li key={b} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.muted, lineHeight: 1.5 }}>
            <span style={{ color: plan.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
            {b}
          </li>
        ))}
      </ul>
      <button onClick={onCta} style={{
        padding: '11px 0', borderRadius: 10, border: `1.5px solid ${plan.color}`,
        background: 'transparent', color: plan.color, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
      }}>
        Get Early Access
      </button>
    </div>
  )
}

export default function HomePage() {
  const [mob, setMob] = useState(false)
  const [tab, setTab] = useState(false)
  const [heroMob, setHeroMob] = useState(false)
  const [showBtt, setShowBtt] = useState(false)
  const [navHover, setNavHover] = useState<string | null>(null)

  // Demo form
  const [dFirst, setDFirst] = useState('')
  const [dLast, setDLast] = useState('')
  const [dEmail, setDEmail] = useState('')
  const [dPhone, setDPhone] = useState('')
  const [dChannels, setDChannels] = useState<Set<'Email' | 'Phone Call' | 'SMS'>>(new Set())
  const [dScenario, setDScenario] = useState<string | null>(null)
  const [dLoading, setDLoading] = useState(false)
  const [dSuccess, setDSuccess] = useState(false)
  const [dModal, setDModal] = useState(false)
  const [dError, setDError] = useState<string | null>(null)

  // Survey
  const [sAns, setSAns] = useState<Record<string, string>>({})
  const [sMulti, setSMulti] = useState<string[]>([])
  const [sComments, setSComments] = useState('')
  const [sDone, setSDone] = useState(false)

  // Early access
  const [eaFirst, setEaFirst] = useState('')
  const [eaEmail, setEaEmail] = useState('')
  const [eaDone, setEaDone] = useState(false)

  // Pricing carousel
  const pricingRef = useRef<HTMLDivElement>(null)
  const [activePlan, setActivePlan] = useState(0)

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap'
    document.head.appendChild(link)
    return () => { if (document.head.contains(link)) document.head.removeChild(link) }
  }, [])

  useEffect(() => {
    function check() {
      const w = window.innerWidth
      setMob(w < 640)
      setTab(w >= 640 && w < 1024)
      setHeroMob(w < 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const onScroll = () => setShowBtt(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const offset = mob ? 56 : 62
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  async function handleDemo(e: React.FormEvent) {
    e.preventDefault()
    if (dChannels.size === 0) { setDError('Please select at least one channel.'); return }
    if (!dScenario) { setDError('Please select a scenario.'); return }
    if (dChannels.has('Email') && !dEmail) { setDError('Email is required for the Email channel.'); return }
    if ((dChannels.has('Phone Call') || dChannels.has('SMS')) && !dPhone) {
      setDError('Phone is required for Phone Call / SMS.'); return
    }
    setDError(null)
    setDLoading(true)
    try {
      await Promise.all(
        Array.from(dChannels).map(ch =>
          fetch('/api/start-demo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName: dFirst, lastName: dLast, company: 'MVP Supplies', email: dEmail, phone: `+1${dPhone.replace(/\D/g, '')}`, channel: ch, scenario: dScenario }),
          }).then(async res => {
            if (!res.ok) {
              const d = await res.json().catch(() => ({}))
              throw new Error((d as { error?: string }).error ?? 'Something went wrong.')
            }
          })
        )
      )
      setDSuccess(true)
      setDModal(true)
    } catch (err) {
      setDError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setDLoading(false)
    }
  }

  function resetDemo() {
    setDSuccess(false); setDModal(false); setDError(null)
    setDFirst(''); setDLast(''); setDEmail(''); setDPhone('')
    setDChannels(new Set()); setDScenario(null)
  }

  function toggleChannel(ch: 'Email' | 'Phone Call' | 'SMS') {
    setDChannels(prev => {
      const next = new Set(prev)
      if (next.has(ch)) next.delete(ch)
      else next.add(ch)
      return next
    })
  }

  const needsEmail = dChannels.has('Email')
  const needsPhone = dChannels.has('Phone Call') || dChannels.has('SMS')
  const emailInvalid = needsEmail && (!dEmail || !dEmail.includes('@'))
  const phoneInvalid = needsPhone && dPhone.replace(/\D/g, '').length < 10
  const nameOk = !!dFirst && !!dLast
  const canSubmit = dChannels.size > 0 && nameOk && !emailInvalid && !phoneInvalid && !!dScenario
  const activeStep = dChannels.size === 0 ? 1 : !nameOk ? 2 : !canSubmit ? 3 : 4

  function toggleMulti(v: string) {
    setSMulti(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: `1.5px solid ${C.border}`, background: C.bgAlt, color: C.text,
    fontSize: 16, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  function chip(active: boolean, color: string, dim: string): React.CSSProperties {
    return {
      padding: '7px 15px', borderRadius: 999, border: `1.5px solid ${active ? color : C.border}`,
      background: active ? dim : 'transparent', color: active ? color : C.muted,
      fontSize: 13, fontWeight: 600, cursor: 'pointer',
      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }
  }

  const labelSt: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: C.muted,
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  }

  const isDesktop = !mob && !tab

  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", color: C.text }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* SUCCESS MODAL */}
      {dModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: C.card, borderRadius: 20, padding: 32,
            maxWidth: 420, width: '100%', boxShadow: C.shadowMd,
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, color: C.green, fontWeight: 700, marginBottom: 12, lineHeight: 1 }}>✓</div>
            <p style={{ fontWeight: 700, fontSize: 20, color: C.text, margin: '0 0 16px' }}>Demo Started</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, width: '100%' }}>
              {Array.from(dChannels).map(ch => (
                <p key={ch} style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  {ch === 'Email'
                    ? "Expect an email from agent@phoresight.io — check your spam if you don't see it within a minute."
                    : ch === 'Phone Call'
                    ? 'Expect a call from +1 (617) 693-4222 within the next 30 seconds.'
                    : 'Expect a text from +1 (617) 693-4222 within the next 30 seconds.'}
                </p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setDModal(false)}
              style={{
                width: '100%', minHeight: 48, borderRadius: 10,
                background: C.blue, color: '#fff', border: 'none',
                fontSize: 16, fontWeight: 700, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${C.border}`,
        height: mob ? 56 : 62, display: 'flex', alignItems: 'center', padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
          <img src="/brand/FullLogo_Transparent_NoBuffer.jpg" alt="Phoresight" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
          <div className="hs" style={{ display: 'flex', gap: 2, overflowX: 'auto', marginLeft: 12 }}>
            {[['Survey', 'survey'], ['Pricing', 'pricing'], ['Features', 'features']].map(([l, h]) => (
              <button key={h} onClick={() => scrollTo(h)}
                onMouseEnter={() => setNavHover(h)} onMouseLeave={() => setNavHover(null)}
                style={{
                  whiteSpace: 'nowrap', padding: '6px 12px', borderRadius: 8, border: 'none',
                  background: navHover === h ? C.blueDim : 'transparent',
                  color: navHover === h ? C.blue : C.muted,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        background: 'radial-gradient(ellipse at 70% -10%, rgba(37,99,235,0.08) 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, rgba(124,58,237,0.06) 0%, transparent 50%)',
        padding: mob ? '52px 20px 64px' : '88px 24px 96px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', textAlign: heroMob ? 'left' : 'center' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 28 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#2563EB' }}>Boston Tech Week 2026</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 52 : 68, lineHeight: 1.03, color: C.text, margin: '0 0 18px', letterSpacing: '-1.5px' }}>Clyintel</h1>
            <p style={{ fontSize: mob ? 19 : 22, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
              <em>Collections</em> &amp; <em>Client Intelligence</em> tool built for Small Businesses
            </p>
            <div style={{ maxWidth: 420, margin: '0 auto' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['Stop Chasing. Start Collecting.', 'Quick & Easy Setup. Save Time. Increase Revenue.', 'AI-powered outreach via email, text, & phone calls', 'Integrates with existing Invoice & A/R software'].map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10, textAlign: 'left' }}>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: 16, lineHeight: 1.5, flexShrink: 0 }}>✓</span>
                    <span style={{ fontSize: 16, color: C.text, lineHeight: 1.5 }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: heroMob ? 'flex-start' : 'center' }}>
              <button onClick={() => scrollTo('demo')} style={{ padding: '13px 28px', borderRadius: 10, background: C.blue, color: '#fff', border: 'none', fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                Try the Live Demo
              </button>
              <button onClick={() => scrollTo('early-access')} style={{ padding: '13px 28px', borderRadius: 10, background: 'transparent', color: C.blue, border: `1.5px solid ${C.blue}`, fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                Join Waitlist
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* DEMO */}
      <section id="demo" style={{ padding: mob ? '64px 20px' : '80px 24px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <SectionTag label="LIVE DEMO" color={C.blue} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 32 : 40, color: C.text, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Clyintel in Action</h2>
          <div style={{ background: C.card, borderRadius: 20, border: `1.5px solid ${C.border}`, boxShadow: C.shadowMd, overflow: 'hidden' }}>

            {/* Demo example */}
            <div style={{ background: C.blueDim, padding: '20px 32px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Demo Example</span>
              <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                You are MVP Supplies — a client with an overdue invoice. Select a scenario and experience how Boston Tech Week uses Clyintel to recover payments.
              </p>
            </div>

            <form onSubmit={handleDemo} style={{ padding: mob ? '24px 20px' : '32px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* STEP 1 — Contact Method */}
              <div>
                <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', marginBottom: 8 }}>Step 1 — Contact Method</span>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {(['Email', 'Phone Call'] as const).map(ch => {
                    const checked = dChannels.has(ch)
                    return (
                      <div key={ch} onClick={() => toggleChannel(ch)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                          border: `2px solid ${checked ? C.blue : C.border}`,
                          background: checked ? C.blue : C.bgAlt,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.15s',
                        }}>
                          {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 15, color: C.text, fontWeight: 500, userSelect: 'none' }}>{ch === 'Email' ? '📧 Email' : ch === 'Phone Call' ? '📞 Phone Call' : ch}</span>
                      </div>
                    )
                  })}
                  {false && (
                    <div onClick={() => toggleChannel('SMS')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${dChannels.has('SMS') ? C.blue : C.border}`,
                        background: dChannels.has('SMS') ? C.blue : C.bgAlt,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {dChannels.has('SMS') && <span style={{ color: '#fff', fontSize: 10, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 15, color: C.text, fontWeight: 500, userSelect: 'none' }}>SMS</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 2 — Contact Info */}
              <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', marginBottom: 8 }}>Step 2 — Contact Info</span>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelSt}>First Name</label>
                  <input className="li" required value={dFirst} onChange={e => setDFirst(e.target.value)} placeholder="John" style={{ ...inp, borderColor: !dFirst ? C.blue : C.border }} />
                </div>
                <div>
                  <label style={labelSt}>Last Name</label>
                  <input className="li" required value={dLast} onChange={e => setDLast(e.target.value)} placeholder="Johnson" style={{ ...inp, borderColor: !dLast ? C.blue : C.border }} />
                </div>
              </div>

              <div>
                <label style={labelSt}>Email</label>
                <input className="li" type="email" value={dEmail} onChange={e => setDEmail(e.target.value)} placeholder="alex@company.com"
                  style={{ ...inp, borderColor: emailInvalid ? C.blue : C.border }} />
              </div>

              <div>
                <label style={labelSt}>Phone</label>
                <div style={{ display: 'flex', alignItems: 'center', borderRadius: 10, border: `1.5px solid ${phoneInvalid ? C.blue : C.border}`, background: '#FFFFFF', overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <span style={{ padding: '10px 12px', fontSize: 16, color: C.muted, background: C.bg, borderRight: `1.5px solid ${C.border}`, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", userSelect: 'none' }}>+1</span>
                  <input className="li" type="tel" autoComplete="off" value={dPhone} onChange={e => setDPhone(fmtPhone(e.target.value))} placeholder="(555) 000-0000" style={{ ...inp, border: 'none', borderRadius: 0, background: 'transparent', boxShadow: 'none' }} />
                </div>
              </div>

              {/* STEP 3 — Select Scenario */}
              <div>
                <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', marginBottom: 8 }}>Step 3 — Select Scenario</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {SCENARIOS.map(s => {
                    const active = dScenario === s.id
                    return (
                      <button key={s.id} type="button" onClick={() => setDScenario(s.id)} style={{
                        display: 'block', width: '100%',
                        padding: '14px 18px', borderRadius: 12, textAlign: 'left',
                        border: `1.5px solid ${active ? s.color : C.border}`,
                        background: active ? s.dim : C.bgAlt,
                        boxShadow: active ? `0 0 0 3px ${s.color}22` : 'none',
                        cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: C.text }}>{s.label}</p>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 9px', borderRadius: 6, background: s.color, color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {s.tag}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 3px', fontSize: 14, color: C.text, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.invoice} · {s.amount}</p>
                        <p style={{ margin: 0, fontSize: 13, color: C.muted }}>{s.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {dError && <p style={{ color: C.red, fontSize: 14, margin: 0 }}>{dError}</p>}

              {/* STEP 4 — Start Demo */}
              {!dSuccess && <span style={{ display: 'inline-flex', alignSelf: 'flex-start', background: C.blueDim, color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', marginBottom: 8 }}>Step 4 — Start Demo</span>}
              {dSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button type="submit" disabled={dLoading || !canSubmit} style={{ minHeight: 54, borderRadius: 12, background: canSubmit ? C.blue : C.dim, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: (dLoading || !canSubmit) ? 'not-allowed' : 'pointer', opacity: dLoading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.15s, background 0.15s' }}>
                    {dLoading ? 'Starting…' : 'Try Again'}
                  </button>
                  <button type="button" onClick={resetDemo} style={{ background: 'none', border: 'none', color: C.muted, fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: '8px 0' }}>
                    Reset
                  </button>
                </div>
              ) : (
                <button type="submit" disabled={dLoading || !canSubmit} style={{ minHeight: 54, borderRadius: 12, background: canSubmit ? C.blue : C.dim, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: (dLoading || !canSubmit) ? 'not-allowed' : 'pointer', opacity: dLoading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", transition: 'opacity 0.15s, background 0.15s' }}>
                  {dLoading ? 'Starting…' : 'Start Demo'}
                </button>
              )}

              <p style={{ fontSize: 12, color: C.dim, textAlign: 'center', margin: 0 }}>US numbers only. No account needed.</p>
            </form>
          </div>
        </div>
      </section>

      {/* SURVEY */}
      <section id="survey" style={{ padding: mob ? '64px 20px' : '80px 24px', background: C.bgAlt }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <SectionTag label="SURVEY" color={C.blue} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 32 : 40, color: C.text, margin: '0 0 12px', letterSpacing: '-0.5px' }}>We Could Use Your Help</h2>
          <p style={{ fontSize: 16, color: C.muted, margin: '0 0 32px', lineHeight: 1.6 }}>A 2 question minimum. Your answers shape what we build next. 🫶</p>

          {sDone ? (
            <div style={{ background: C.card, borderRadius: 20, padding: '48px 32px', boxShadow: C.shadow, border: `1px solid ${C.border}`, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.greenDim, border: `2px solid ${C.green}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 22, color: C.green, fontWeight: 700 }}>✓</div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, margin: '0 0 10px' }}>Thank you</h3>
              <p style={{ color: C.muted, fontSize: 15, margin: 0 }}>Your feedback goes straight to the product team.</p>
            </div>
          ) : (() => {
            const answeredCount = [
              !!sAns.attendance,
              !!sAns.headache,
              sMulti.length > 0,
              !!sAns.payLate,
              !!sAns.timeChasing,
              !!sAns.pricing,
              !!sAns.demo,
              sComments.trim().length > 0,
            ].filter(Boolean).length
            const canSubmit = answeredCount >= 2
            return (
              <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow, overflow: 'hidden' }}>
                {/* Q1 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>Are you joining us remotely or here in person?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['📍 Here in person', '💻 Joining remotely'].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, attendance: o }))} style={chip(sAns.attendance === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>{"What's your biggest invoicing headache? 🤕"}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['I actually enjoy it 😄', 'Everything about chasing payments 😤', 'The time it eats up ⏱️', 'Never knowing when cash is coming in 😰'].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, headache: o }))} style={chip(sAns.headache === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q3 - multi-select */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 4px', lineHeight: 1.5 }}>How do you currently follow up on late payments?</p>
                  <p style={{ fontSize: 13, color: C.dim, margin: '0 0 14px' }}>Select all that apply</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SURVEY_Q3_OPTS.map(o => (
                      <button key={o} type="button" onClick={() => toggleMulti(o)} style={chip(sMulti.includes(o), C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q4 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>How often do clients pay late?</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Rarely/Never', 'Sometimes', 'Almost always'].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, payLate: o }))} style={chip(sAns.payLate === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q5 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>How much time do you spend chasing late payments each month? ⏱️</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Less than 5 hrs', 'Between 5–10 hrs', 'More than 10 hrs'].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, timeChasing: o }))} style={chip(sAns.timeChasing === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q6 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>{"What do you think of Clyintel's pricing?"}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['😁 Very reasonable', '🙂 Fair for the value', '😐 Not sure yet', '🤔 A bit steep'].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, pricing: o }))} style={chip(sAns.pricing === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q7 */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>How was the live demo experience? 🚀</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Loved it', 'Pretty good', 'Needs work', "Didn't try it"].map(o => (
                      <button key={o} type="button" onClick={() => setSAns(prev => ({ ...prev, demo: o }))} style={chip(sAns.demo === o, C.blue, C.blueDim)}>{o}</button>
                    ))}
                  </div>
                </div>

                {/* Q8 - free text */}
                <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: C.text, margin: '0 0 14px', lineHeight: 1.5 }}>Anything else? We&apos;re all ears 👂</p>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={sComments}
                      onChange={e => setSComments(e.target.value.slice(0, 50))}
                      placeholder="Your thoughts…"
                      rows={3}
                      style={{ ...inp, resize: 'none', paddingBottom: 28 }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 8, right: 12, fontSize: 12, fontWeight: 600,
                      color: sComments.length >= 50 ? '#EF4444' : C.dim,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>{sComments.length}/50</span>
                  </div>
                </div>

                <div style={{ padding: '24px 28px' }}>
                  <button
                    type="button"
                    onClick={() => { if (canSubmit) setSDone(true) }}
                    disabled={!canSubmit}
                    style={{
                      width: '100%', minHeight: 50, borderRadius: 10, border: 'none',
                      background: canSubmit ? C.blue : C.border,
                      color: canSubmit ? '#fff' : C.dim,
                      fontSize: 16, fontWeight: 700,
                      cursor: canSubmit ? 'pointer' : 'not-allowed',
                      fontFamily: "'DM Sans', sans-serif",
                      opacity: canSubmit ? 1 : 0.6,
                      transition: 'all 0.2s',
                    }}
                  >
                    Submit Survey
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: mob ? '64px 0' : '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: mob ? '0 20px' : '0' }}>
          <SectionTag label="PRICING" color={C.blue} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 32 : 40, color: C.text, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 16, color: C.muted, margin: '0 0 40px', lineHeight: 1.6 }}>Revenue share only on what we actually recover.</p>
        </div>

        {isDesktop ? (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            {PLANS.map(p => <PlanCard key={p.name} plan={p} onCta={() => scrollTo('early-access')} />)}
          </div>
        ) : (
          <div>
            <div ref={pricingRef} className="hs"
              onScroll={() => {
                if (!pricingRef.current) return
                const el = pricingRef.current
                const cardW = el.scrollWidth / PLANS.length
                setActivePlan(Math.round(el.scrollLeft / cardW))
              }}
              style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 16, paddingLeft: 20, paddingRight: 20, paddingBottom: 8 }}>
              {PLANS.map(p => (
                <div key={p.name} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: mob ? '82vw' : '54vw' }}>
                  <PlanCard plan={p} onCta={() => scrollTo('early-access')} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {PLANS.map((_, i) => (
                <div key={i} style={{ width: i === activePlan ? 20 : 8, height: 8, borderRadius: 4, background: i === activePlan ? C.blue : C.dim, transition: 'all 0.2s' }} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: mob ? '64px 20px' : '80px 24px', background: C.bgAlt }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <SectionTag label="FEATURES" color={C.blue} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 32 : 40, color: C.text, margin: '0 0 36px', letterSpacing: '-0.5px' }}>Everything you need to get paid</h2>
          <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 20 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.card, borderRadius: 16, padding: '24px', border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{f.icon}</span>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: C.text, margin: '0 0 8px' }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EARLY ACCESS */}
      <section id="early-access" style={{ padding: mob ? '64px 20px' : '80px 24px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <SectionTag label="WAITLIST" color={C.green} />
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: mob ? 32 : 40, color: C.text, margin: '0 0 12px', letterSpacing: '-0.5px' }}>Join Waitlist</h2>
          <p style={{ fontSize: 16, color: C.muted, margin: '0 0 32px', lineHeight: 1.6 }}>
            Reserve your spot on the waitlist. We'll reach out when early access opens — no payment required.
          </p>

          {eaDone ? (
            <div style={{ background: C.card, borderRadius: 20, padding: '48px 32px', boxShadow: C.shadow, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: C.text, margin: '0 0 10px' }}>You're on the waitlist</h3>
              <p style={{ color: C.muted, fontSize: 15, margin: 0, lineHeight: 1.6 }}>We'll be in touch when early access opens. Check your inbox for a confirmation.</p>
            </div>
          ) : (
            <div style={{ background: C.card, borderRadius: 20, padding: mob ? '28px 20px' : '36px 32px', boxShadow: C.shadowMd, border: `1px solid ${C.border}` }}>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={labelSt}>First Name</label>
                  <input className="li" value={eaFirst} onChange={e => setEaFirst(e.target.value)} placeholder="Alex" style={inp} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={labelSt}>Email</label>
                  <input className="li" type="email" value={eaEmail} onChange={e => setEaEmail(e.target.value)} placeholder="alex@company.com" style={inp} />
                </div>
              </div>
              <button type="button" onClick={() => setEaDone(true)} style={{ width: '100%', minHeight: 50, borderRadius: 10, background: C.green, color: '#fff', border: 'none', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Join Waitlist
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: C.text, color: '#fff', padding: mob ? '48px 20px' : '60px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, margin: '0 0 14px' }}>Clyintel</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 16px', maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65 }}>
          Collections &amp; Client Intelligence tool built for Small Businesses to save time &amp; increase revenue
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '0 0 12px', lineHeight: 1.6 }}>
          Demo messages are for demonstration purposes only. US numbers only.
        </p>
        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans', sans-serif" }}>
          Privacy Policy
        </button>
      </footer>

      {/* BACK TO TOP */}
      {showBtt && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 24, right: 24, width: 48, height: 48, borderRadius: '50%', background: C.blue, color: '#fff', border: 'none', fontSize: 22, cursor: 'pointer', boxShadow: C.shadowMd, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
          ↑
        </button>
      )}
    </div>
  )
}
