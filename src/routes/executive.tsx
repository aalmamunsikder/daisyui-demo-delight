import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, ConfidenceTag, Metric, Pill, SectionTitle, stateTone } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { money, moneyShort } from "@/lib/prive/forecast";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "Executive Intelligence — Privé" },
      { name: "description", content: "Enterprise revenue, labor, margin pressure and what-if scenarios across all locations." },
      { property: "og:title", content: "Executive Intelligence — Privé" },
      { property: "og:description", content: "Enterprise revenue, labor, margin pressure and what-if scenarios across all locations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExecutivePage,
});

function ExecutivePage() {
  const { state, derived: d, dispatch } = usePrive();
  const e = d.enterprise;
  const s = d.scenario;

  return (
    <PriveShell
      persona="executive"
      title="Enterprise intelligence"
      subtitle="Twelve locations, one model — every figure recalculated from the same historical series."
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Revenue today" value={moneyShort(e.revenueToday)} sub="All locations" />
            <Metric label="Month to date" value={moneyShort(e.monthRevenue)} sub={`Forecast ${moneyShort(e.forecastRevenue)}`} />
            <Metric label="Labor" value={`${e.laborPct}%`} sub="Target 25.6%" tone={e.laborPct > 25.6 ? "warn" : "good"} />
            <Metric label="Food cost" value={`${e.foodCostPct}%`} sub="Target 29.0%" tone={e.foodCostPct > 29 ? "warn" : "good"} />
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Same-store sales" value={`${e.sameStoreSalesPct > 0 ? "+" : ""}${e.sameStoreSalesPct}%`} tone={e.sameStoreSalesPct >= 0 ? "good" : "bad"} sub="14d vs prior 14d" />
            <Metric label="Margin vs plan" value={`${e.marginDelta} pts`} tone={e.marginDelta < 0 ? "bad" : "good"} sub="Driven by labor + recovery" />
            <Metric label="Guest sentiment" value={`${e.sentiment}`} sub="of 5.0" tone={e.sentiment >= 4.3 ? "good" : "warn"} />
            <Metric label="Forecast accuracy" value={`±${e.forecastVariance}%`} sub="Avg variance vs typical" />
          </div>

          <Card tone="intel">
            <SectionTitle hint="Recalculated live">What-if scenario engine</SectionTitle>
            <label className="block text-sm text-[#101828]/70">
              Weekend traffic change: <span className="font-semibold tabular-nums">{state.scenarioUplift > 0 ? "+" : ""}{state.scenarioUplift}%</span>
              <input
                type="range"
                min={-20}
                max={40}
                step={1}
                value={state.scenarioUplift}
                onChange={(ev) => dispatch({ type: "scenario", uplift: Number(ev.target.value) })}
                className="mt-2 w-full accent-[#7C3AED]"
              />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Metric label="Revenue impact" value={money(s.revenueDelta)} sub={`Total ${moneyShort(s.revenueTotal)}`} tone={s.revenueDelta >= 0 ? "good" : "bad"} />
              <Metric label="Extra transactions" value={s.transactionDelta.toLocaleString()} sub="Across 12 locations" />
              <Metric label="Labor hours" value={`${s.laborHoursDelta > 0 ? "+" : ""}${s.laborHoursDelta}`} sub={`${s.extraStaffNeeded} more team members`} tone={s.laborHoursDelta > 0 ? "warn" : "good"} />
              <Metric label="Inventory exposure" value={`${s.inventoryExposureSkus}`} sub="SKUs projected short" tone={s.inventoryExposureSkus ? "warn" : "good"} />
              <Metric label="Service risk" value={`${s.serviceRiskPct}%`} sub="Threshold breach probability" tone={s.serviceRiskPct > 50 ? "bad" : "warn"} />
              <div className="flex items-center rounded-xl border border-[#101828]/8 bg-white px-4 py-3">
                <ConfidenceTag level={s.confidence} />
              </div>
            </div>
            <p className="mt-3 text-xs text-[#101828]/45">
              Sources: Toast POS · Restaurant365 · Paycor · Privé Scenario Engine
            </p>
          </Card>

          <Card>
            <SectionTitle hint={`${e.atRiskStores} need attention`}>Portfolio health</SectionTitle>
            <div className="space-y-2">
              {d.health.map((h) => (
                <div key={h.restaurant.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{h.restaurant.name}</div>
                    <div className="text-xs text-[#101828]/50">{h.restaurant.city} · {h.restaurant.ownership}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums">{h.score}</span>
                    <Pill tone={stateTone(h.state)}>{h.state}</Pill>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Margin pressure drivers</SectionTitle>
            <ul className="space-y-2 text-sm text-[#101828]/75">
              <li className="rounded-lg border border-[#101828]/8 px-3 py-2">Enterprise labor at {e.laborPct}% against a 25.6% target.</li>
              <li className="rounded-lg border border-[#101828]/8 px-3 py-2">Protein cost increase of 6.2% announced by Southern Meats.</li>
              <li className="rounded-lg border border-[#101828]/8 px-3 py-2">{e.turnoverRiskStores} location(s) carrying elevated turnover.</li>
              <li className="rounded-lg border border-[#101828]/8 px-3 py-2">Service-recovery spend of {money(e.recoverySpend)} issued this period.</li>
              <li className="rounded-lg border border-[#101828]/8 px-3 py-2">{e.inventoryRiskStores} location(s) with SKUs projected short tomorrow.</li>
            </ul>
          </Card>
        </div>

        <Card tone="intel" className="lg:sticky lg:top-6 min-h-[520px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="executive" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
