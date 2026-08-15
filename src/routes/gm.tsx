import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, Meter, Metric, Pill, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { money } from "@/lib/prive/forecast";

export const Route = createFileRoute("/gm")({
  head: () => ({
    meta: [
      { title: "GM Command Center — Privé" },
      { name: "description", content: "Tomorrow's readiness score, staffing gaps, inventory risk and guest recovery in one view." },
      { property: "og:title", content: "GM Command Center — Privé" },
      { property: "og:description", content: "Tomorrow's readiness score, staffing gaps, inventory risk and guest recovery in one view." },
    ],
  }),
  component: GmPage,
});

function GmPage() {
  const { derived: d } = usePrive();
  return (
    <PriveShell
      persona="gm"
      title="Ballantyne #02 command center"
      subtitle="Everything Privé knows about tomorrow, ranked by financial and guest impact."
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <Card tone={d.readiness.score >= 85 ? "default" : "alert"}>
            <SectionTitle hint="Tomorrow">Readiness score</SectionTitle>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold tabular-nums">{d.readiness.score}%</span>
              <Pill tone={d.readiness.score >= 85 ? "teal" : "amber"}>{d.readiness.score >= 85 ? "Ready" : "Action required"}</Pill>
            </div>
            <div className="mt-3">
              <Meter value={d.readiness.score} tone={d.readiness.score >= 85 ? "teal" : "amber"} />
            </div>
            <ul className="mt-4 space-y-2">
              {d.readiness.risks.map((r) => (
                <li key={r.label} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.label}</span>
                    <Pill tone={r.probability > 50 ? "red" : "amber"}>{r.probability}% risk</Pill>
                  </div>
                  <p className="mt-1 text-[#101828]/60">{r.detail}</p>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Forecast sales" value={money(d.tomorrow.sales)} sub={`${d.tomorrow.vsTypicalPct > 0 ? "+" : ""}${d.tomorrow.vsTypicalPct}% vs typical`} />
            <Metric label="Staffing gap" value={`${d.staffing.gap}`} sub={`${d.staffing.scheduledStaff} of ${d.staffing.recommendedStaff}`} tone={d.staffing.gap > 0 ? "warn" : "good"} />
            <Metric label="Open guest issues" value={`${d.openComplaints}`} sub="Awaiting resolution" tone={d.openComplaints ? "warn" : "good"} />
          </div>
        </div>

        <Card tone="intel" className="min-h-[520px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="gm" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
