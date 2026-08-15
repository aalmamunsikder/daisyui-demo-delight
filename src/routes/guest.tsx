import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Button, Card, Metric, Pill, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { GM_RESTAURANT_ID, TODAY, iso } from "@/lib/prive/data";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Guest Experience — Privé" },
      { name: "description", content: "Voice and digital guest service with drafted recovery held for manager approval." },
      { property: "og:title", content: "Guest Experience — Privé" },
      { property: "og:description", content: "Voice and digital guest service with drafted recovery held for manager approval." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GuestPage,
});

const statusTone = (s: string) =>
  s === "Resolved" ? "teal" : s === "Escalated" ? "violet" : s === "Rejected" ? "neutral" : "amber";

function GuestPage() {
  const { state, derived: d, dispatch } = usePrive();

  const logComplaint = () =>
    dispatch({
      type: "createComplaint",
      complaint: {
        id: `c-live-${state.complaints.length + 1}`,
        customer: "Priya Raman",
        restaurantId: GM_RESTAURANT_ID,
        date: iso(TODAY),
        channel: "Voice",
        type: "Missing item",
        summary: "Two sides of bacon missing from a curbside pickup order placed at 9:42 AM.",
        sentiment: "Negative",
        severity: "Medium",
        status: "Awaiting Approval",
        orderRef: "ORD-51993",
        recommendedCredit: 15,
        draftResponse:
          "Hi Priya, I'm sorry your order was incomplete — that's on us. I've flagged it with the expo team on duty. I'd like to make it right with a $AMOUNT dining credit and personally welcome you back on your next visit.\n\n— General Manager, The Morning Table",
      },
    });

  return (
    <PriveShell
      persona="guest"
      title="Guest experience"
      subtitle="Every guest contact is answered instantly; anything with a cost waits for a manager."
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Open issues" value={`${d.openComplaints}`} tone={d.openComplaints ? "warn" : "good"} sub="Ballantyne #02" />
            <Metric label="Awaiting GM" value={`${d.awaitingApproval}`} tone="warn" sub="Drafted, not sent" />
            <Metric
              label="Forecast tomorrow"
              value={`${d.complaintForecast.expected}`}
              sub={`${d.complaintForecast.ratePer1000} per 1,000 transactions`}
            />
          </div>

          <Card tone="alert">
            <SectionTitle hint="Voice AI · 24/7">Report an issue</SectionTitle>
            <p className="text-sm text-[#101828]/70">
              Privé answers the phone, captures the order reference, classifies the issue and drafts a response. It never
              issues money on its own — the general manager approves every credit.
            </p>
            <div className="mt-3">
              <Button onClick={logComplaint}>Simulate guest call — missing item</Button>
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`${d.gmComplaints.length} total`}>Issue status</SectionTitle>
            <div className="space-y-2">
              {d.gmComplaints.slice(0, 8).map((c) => (
                <div key={c.id} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{c.customer}</span>
                    <Pill tone={statusTone(c.status) as "amber"}>{c.status}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-[#101828]/60">
                    {c.type} · {c.severity} severity · {c.channel} · {c.orderRef}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Single-use, fraud-controlled">Recovery credits issued</SectionTitle>
            {d.gmComplaints.length && state.giftCredits.length === 0 ? (
              <p className="text-sm text-[#101828]/55">No credits issued yet — approve a recovery in the GM command center.</p>
            ) : null}
            <div className="space-y-2">
              {state.giftCredits.map((g) => (
                <div key={g.code} className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div>
                    <div className="font-mono text-sm font-medium">{g.code}</div>
                    <div className="text-xs text-[#101828]/55">
                      ${g.amount} · {g.customer} · issued {g.issuedAt} · expires {g.expires}
                    </div>
                  </div>
                  <Button
                    variant={g.redeemed ? "ghost" : "primary"}
                    disabled={g.redeemed}
                    onClick={() => dispatch({ type: "redeemCredit", code: g.code })}
                  >
                    {g.redeemed ? "Redeemed" : "Redeem"}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card tone="intel" className="lg:sticky lg:top-6 min-h-[520px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="guest" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
