"use client";

import { useState } from "react";

const SCENARIOS = [
  {
    id: 1 as const,
    days: 7,
    label: "7 Days",
    stage: "EARLY STAGE",
    description: "First signs of distress. Catch it early.",
    activeBorder: "border-green-500",
    badge: "bg-green-500/20 text-green-400 border border-green-500/40",
  },
  {
    id: 2 as const,
    days: 45,
    label: "45 Days",
    stage: "ESCALATING",
    description: "Situation has worsened. Time is running out.",
    activeBorder: "border-amber-500",
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
  },
  {
    id: 3 as const,
    days: 90,
    label: "90 Days",
    stage: "CRITICAL",
    description: "Full-blown crisis. Every hour matters.",
    activeBorder: "border-red-500",
    badge: "bg-red-500/20 text-red-400 border border-red-500/40",
  },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export default function HomePage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("Meridian Supply Co.");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedScenario, setSelectedScenario] = useState<1 | 2 | 3 | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPhone(formatPhone(e.target.value));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScenario) {
      setError("Please select a scenario.");
      return;
    }
    if (!email && !phone) {
      setError("Please enter at least an email or phone number.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/start-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, companyName, email, phone, scenario: selectedScenario }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Something went wrong.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">📱</div>
          <h2 className="text-2xl font-semibold text-white">It&apos;s on its way.</h2>
          <p className="text-slate-400 text-sm">Check your phone or inbox — your demo is live.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3 accent-badge">
            Live Demo
          </span>
          <h1 className="text-3xl font-bold text-white leading-tight">
            See Clyintel{" "}
            <span className="text-accent">in action</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Pick a scenario and we&apos;ll walk you through a real delinquency case — delivered via SMS, email, or both.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* First name + Last name */}
          <div className="flex gap-3">
            <div className="space-y-1 flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                First Name
              </label>
              <input
                type="text"
                required
                autoComplete="given-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Alex"
                className="field-input"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Last Name
              </label>
              <input
                type="text"
                required
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Johnson"
                className="field-input"
              />
            </div>
          </div>

          {/* Company name */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Company Name
            </label>
            <input
              type="text"
              required
              autoComplete="organization"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Meridian Supply Co."
              className="field-input"
            />
          </div>

          {/* Email + Phone */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Delivery Channel <span className="normal-case font-normal text-slate-500">(email, SMS, or both)</span>
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@company.com"
                  className="field-input"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Phone Number
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="(555) 000-0000"
                  className="field-input"
                />
              </div>
            </div>
          </div>

          {/* Scenario cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Choose a Scenario
            </p>
            <div className="space-y-3">
              {SCENARIOS.map((s) => (
                <button
                  key={s.days}
                  type="button"
                  onClick={() => setSelectedScenario(s.id)}
                  className={`w-full text-left rounded-xl px-4 py-4 border-2 transition-all duration-150 card-bg ${
                    selectedScenario === s.id
                      ? `${s.activeBorder} bg-white/5`
                      : "border-transparent hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-white font-semibold text-sm">
                        {s.label} overdue
                      </div>
                      <div className="text-slate-400 text-xs">{s.description}</div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${s.badge}`}>
                      {s.stage}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="cta-btn w-full py-4 rounded-xl font-bold text-white text-base transition-all duration-150 active:scale-95 disabled:opacity-60"
          >
            {loading ? "Starting…" : "Start the Demo →"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          No account needed. US numbers only.
        </p>
      </div>
    </main>
  );
}
