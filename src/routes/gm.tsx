import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Button, Card, Meter, Metric, Pill, SectionTitle } from "@/components/prive/ui";
import { AlertCard, MorningBrief, ReadinessCard } from "@/components/prive/panels";
import { usePrive } from "@/lib/prive/store";
import { money } from "@/lib/prive/forecast";
import { JORDAN_SEPARATION } from "@/lib/prive/data";

export const Route = createFileRoute("/gm")({
  head: () => ({
    meta: [
      { title: "GM Command Center — Privé" },
      { name: "description", content: "Tomorrow's readiness score, staffing gaps, inventory risk and guest recovery in one view." },
      { property: "og:title", content: "GM Command Center — Privé" },
      { property: "og:description", content: "Tomorrow's readiness score, staffing gaps, inventory risk and guest recovery in one view." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GmPage,
});

function GmPage() {
  const { state, derived: d, dispatch } = usePrive();
  const [credits, setCredits] = useState<Record<string, number>>({});
  const pending = d.gmComplaints.filter((c) => c.status === "Awaiting Approval" || c.status === "Open");

  return (
    <PriveShell
      persona="gm"
      title="Ballantyne #02 command center"
      subtitle="Everything Privé knows about tomorrow, ranked by financial and guest impact."
    >
      <div className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          <MorningBrief />

          <div className="grid gap-3 sm:grid-cols-4">
            <Metric
              label="Forecast sales"
              value={money(d.tomorrow.sales)}
              sub={`${d.tomorrow.vsTypicalPct > 0 ? "+" : ""}${d.tomorrow.vsTypicalPct}% vs typical`}
            />
            <Metric
              label="Staffing gap"
              value={`${d.staffing.gap}`}
              sub={`${d.staffing.scheduledStaff} of ${d.staffing.recommendedStaff}`}
              tone={d.staffing.gap > 0 ? "warn" : "good"}
            />
            <Metric
              label="SKUs at risk"
              value={`${d.atRisk.length}`}
              sub="Below forecast demand"
              tone={d.atRisk.length ? "warn" : "good"}
            />
            <Metric
              label="Open guest issues"
              value={`${d.openComplaints}`}
              sub={`${d.awaitingApproval} awaiting you`}
              tone={d.openComplaints ? "warn" : "good"}
            />
          </div>

          <ReadinessCard />

          <Card>
            <SectionTitle hint={`${d.alerts.length} active`}>Alert center</SectionTitle>
            <div className="space-y-2">
              {d.alerts.map((a) => (
                <AlertCard key={a.id} a={a} onDismiss={() => dispatch({ type: "dismissAlert", id: a.id })} />
              ))}
              {d.alerts.length === 0 ? <p className="text-sm text-[#101828]/55">All alerts cleared.</p> : null}
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Tomorrow's peak block">Staffing</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Recommended" value={`${d.staffing.recommendedStaff}`} sub="Team members 4–8 PM" />
              <Metric label="Scheduled" value={`${d.staffing.scheduledStaff}`} sub={`${d.staffing.laborHoursNeeded} labor hours needed`} />
              <Metric
                label="Projected labor"
                value={`${d.staffing.projectedLaborPct}%`}
                sub={`Target ${d.staffing.targetLaborPct}% · ${money(d.staffing.projectedLaborCost)}`}
                tone={d.staffing.projectedLaborPct > d.staffing.targetLaborPct ? "warn" : "good"}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button onClick={() => dispatch({ type: "sendShiftOffer" })} disabled={state.shiftOfferSent} variant="ghost">
                {state.shiftOfferSent ? "Offer broadcast" : "Broadcast open shift"}
              </Button>
              <Button onClick={() => dispatch({ type: "approveStaffing" })} disabled={d.staffing.gap === 0 && state.extraStaffApproved > 0}>
                {state.extraStaffApproved > 0 ? `${state.extraStaffApproved} added` : "Approve staffing adjustment"}
              </Button>
              {state.shiftAccepted && state.extraStaffApproved === 0 ? (
                <Pill tone="amber">Maya Robinson accepted — approval needed</Pill>
              ) : null}
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`${d.depletion.length} SKUs tracked`}>Inventory risk</SectionTitle>
            <div className="space-y-2">
              {d.depletion
                .filter((i) => i.risk !== "Healthy")
                .slice(0, 6)
                .map((i) => (
                  <div key={i.itemId} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{i.name}</span>
                      <Pill tone={i.risk === "Critical" ? "red" : i.risk === "At Risk" ? "amber" : "neutral"}>{i.risk}</Pill>
                    </div>
                    <p className="mt-1 text-xs text-[#101828]/60">
                      {i.onHand} {i.unit} on hand · {i.projectedUsage} {i.unit} projected usage
                      {i.shortage > 0 ? ` · short ${i.shortage} ${i.unit}` : ""}
                      {i.depletionTime ? ` · depletes ${i.depletionTime}` : ""}
                    </p>
                  </div>
                ))}
              {d.depletion.every((i) => i.risk === "Healthy") ? (
                <p className="text-sm text-[#0B7A6C]">Every tracked SKU covers forecast demand.</p>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => dispatch({ type: "increasePotatoOrder", lbs: Math.max(20, Math.ceil(d.potato.shortage)) })}
                disabled={d.potato.shortage === 0}
              >
                Increase potato order {d.potato.shortage > 0 ? `+${Math.ceil(d.potato.shortage)} lbs` : ""}
              </Button>
              <Button
                variant="ghost"
                onClick={() => dispatch({ type: "transferInventory", lbs: 40 })}
                disabled={d.potato.shortage === 0}
              >
                Transfer 40 lbs from Charlotte #01
              </Button>
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`${pending.length} pending`}>Guest recovery — your approval</SectionTitle>
            <div className="space-y-3">
              {pending.map((c) => {
                const amount = credits[c.id] ?? c.recommendedCredit;
                return (
                  <div key={c.id} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {c.customer} · {c.type}
                      </span>
                      <Pill tone={c.severity === "High" ? "red" : "amber"}>{c.severity} severity</Pill>
                    </div>
                    <p className="mt-1 text-xs text-[#101828]/60">
                      {c.channel} · {c.orderRef} · {c.date}
                    </p>
                    <p className="mt-2 text-sm text-[#101828]/75">{c.summary}</p>
                    <p className="mt-2 whitespace-pre-line rounded-md bg-[#7C3AED]/[0.05] p-2.5 text-xs text-[#101828]/70">
                      {c.draftResponse.replace("$AMOUNT", `$${amount}`)}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1.5 text-xs text-[#101828]/60">
                        Credit $
                        <input
                          type="number"
                          value={amount}
                          min={0}
                          onChange={(e) => setCredits((p) => ({ ...p, [c.id]: Number(e.target.value) }))}
                          className="w-20 rounded-md border border-[#101828]/15 px-2 py-1 text-sm tabular-nums"
                        />
                      </label>
                      <Button onClick={() => dispatch({ type: "resolveComplaint", id: c.id, amount })}>Approve & send</Button>
                      <Button variant="ghost" onClick={() => dispatch({ type: "escalateComplaint", id: c.id })}>
                        Escalate
                      </Button>
                      <Button variant="ghost" onClick={() => dispatch({ type: "rejectComplaint", id: c.id })}>
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
              {pending.length === 0 ? <p className="text-sm text-[#0B7A6C]">No guest recoveries are waiting on you.</p> : null}
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`${d.workforce.total} on roster`}>Workforce</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Active" value={`${d.workforce.active}`} sub={`${d.workforce.onboarding} onboarding`} />
              <Metric
                label="Training complete"
                value={`${d.workforce.trainingCompletionPct}%`}
                sub={`${d.workforce.trainingOverdue} overdue`}
                tone={d.workforce.trainingOverdue ? "warn" : "good"}
              />
              <Metric
                label="Certs expiring"
                value={`${d.workforce.certExpiring}`}
                sub="Within 30 days"
                tone={d.workforce.certExpiring ? "warn" : "good"}
              />
              <Metric label="Avg tenure" value={`${d.workforce.avgTenureMonths} mo`} sub={`${d.workforce.openRoles} open roles`} />
            </div>
            <div className="mt-4 rounded-lg border border-[#101828]/8 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Separation review — {JORDAN_SEPARATION.name}</span>
                <Pill tone={state.separationDecision ? "teal" : "amber"}>
                  {state.separationDecision ?? "Decision required"}
                </Pill>
              </div>
              <p className="mt-1 text-xs text-[#101828]/60">
                {JORDAN_SEPARATION.daysSinceLastShift} days without a scheduled shift. Privé flags it; only you can decide.
              </p>
              {!state.separationDecision ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => dispatch({ type: "separation", decision: "Reach out first" })}>
                    Reach out first
                  </Button>
                  <Button variant="ghost" onClick={() => dispatch({ type: "separation", decision: "Keep on roster" })}>
                    Keep on roster
                  </Button>
                  <Button variant="danger" onClick={() => dispatch({ type: "separation", decision: "Separate" })}>
                    Separate
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="mt-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">I-9 verification — Maya Robinson</span>
                <Button variant={state.i9Complete ? "ghost" : "primary"} disabled={state.i9Complete} onClick={() => dispatch({ type: "completeI9" })}>
                  {state.i9Complete ? "Verified" : "Record verification"}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`Facility ${d.facility.score}%`}>Facility readiness</SectionTitle>
            <Meter value={d.facility.score} tone={d.facility.score >= 90 ? "teal" : "amber"} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {Object.entries(d.facility.detail).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-[#101828]/8 px-3 py-2 text-sm">
                  <span className="capitalize text-[#101828]/70">{k}</span>
                  <span className="font-semibold tabular-nums">{v}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              {d.facility.tasks.map((t) => (
                <div key={t.label} className="flex items-center justify-between gap-2 rounded-lg border border-[#101828]/8 px-3 py-2 text-sm">
                  <span>{t.label}</span>
                  <Pill tone={t.state === "overdue" ? "red" : t.state === "due" ? "amber" : "neutral"}>{t.due}</Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle hint="From corporate">Communications</SectionTitle>
            <div className="space-y-2">
              {d.comms.map((a) => (
                <div key={a.id} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{a.title}</span>
                    {a.acknowledged ? (
                      <Pill tone="teal">Acknowledged</Pill>
                    ) : (
                      <Button variant="quiet" onClick={() => dispatch({ type: "acknowledge", id: a.id, title: a.title })}>
                        Acknowledge
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[#101828]/60">
                    {a.from} · {a.date}
                  </p>
                  <p className="mt-1 text-sm text-[#101828]/70">{a.summary}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <SectionTitle>Pending approvals</SectionTitle>
            <div className="space-y-2">
              {d.pendingApprovals.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-[#101828]/8 px-3 py-2 text-sm">
                  <span className={p.done ? "text-[#101828]/50 line-through" : ""}>{p.label}</span>
                  <Pill tone={p.done ? "teal" : "amber"}>{p.done ? "Cleared" : "Open"}</Pill>
                </div>
              ))}
            </div>
          </Card>
          <Card tone="intel" className="min-h-[520px]">
            <SectionTitle>Ask Privé</SectionTitle>
            <AskPriveConsole persona="gm" compact />
          </Card>
        </div>
      </div>
    </PriveShell>
  );
}
