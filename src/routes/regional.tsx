import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Button, Card, Meter, Metric, Pill, SectionTitle, stateTone } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { TROUBLED_RESTAURANT_ID } from "@/lib/prive/data";

export const Route = createFileRoute("/regional")({
  head: () => ({
    meta: [
      { title: "Regional Portfolio — Privé" },
      { name: "description", content: "Location health across the Carolinas region with deterioration signals and root cause." },
      { property: "og:title", content: "Regional Portfolio — Privé" },
      { property: "og:description", content: "Location health across the Carolinas region with deterioration signals and root cause." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegionalPage,
});

function RegionalPage() {
  const { state, derived: d, dispatch } = usePrive();
  const selected = d.health.find((h) => h.restaurant.id === state.regionalRestaurantId) ?? d.health[0]!;
  const t = selected.restaurant;
  const counts = d.health.reduce<Record<string, number>>((a, x) => ({ ...a, [x.state]: (a[x.state] ?? 0) + 1 }), {});

  return (
    <PriveShell
      persona="regional"
      title="Carolinas portfolio"
      subtitle="Health scores computed from sales trend, turnover, complaints, labor and training — not a static dashboard."
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Locations" value={`${d.health.length}`} sub="Across two regions" />
            <Metric label="Healthy" value={`${counts["Healthy"] ?? 0}`} tone="good" sub="Score 85+" />
            <Metric label="Watch" value={`${counts["Watch"] ?? 0}`} tone="warn" sub="Score 74–84" />
            <Metric
              label="Needs action"
              value={`${(counts["Action Required"] ?? 0) + (counts["Critical"] ?? 0)}`}
              tone="bad"
              sub="Score below 74"
            />
          </div>

          <Card>
            <SectionTitle hint="Select a location">Location health</SectionTitle>
            <div className="space-y-2">
              {d.health.map((h) => (
                <button
                  key={h.restaurant.id}
                  type="button"
                  onClick={() => dispatch({ type: "regionalRestaurant", id: h.restaurant.id })}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    h.restaurant.id === selected.restaurant.id
                      ? "border-[#5146E5]/40 bg-[#5146E5]/[0.05]"
                      : "border-[#101828]/8 bg-white hover:bg-[#101828]/[0.02]"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">{h.restaurant.name}</div>
                    <div className="text-xs text-[#101828]/50">
                      {h.restaurant.city} · {h.restaurant.ownership}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums">{h.score}</span>
                    <Pill tone={stateTone(h.state)}>{h.state}</Pill>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card tone={selected.state === "Healthy" ? "default" : "alert"}>
            <SectionTitle hint={`Health ${selected.score}`}>{t.name} — root cause</SectionTitle>
            <Meter value={selected.score} tone={selected.score >= 85 ? "teal" : selected.score >= 74 ? "amber" : "red"} />
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <Metric label="Turnover" value={`${t.turnoverDelta > 0 ? "+" : ""}${t.turnoverDelta}%`} sub="vs region" tone={t.turnoverDelta > 5 ? "bad" : "neutral"} />
              <Metric label="Complaints" value={`${t.complaintDelta > 0 ? "+" : ""}${t.complaintDelta}%`} sub="vs region" tone={t.complaintDelta > 10 ? "bad" : "neutral"} />
              <Metric label="Labor" value={`${t.laborDelta > 0 ? "+" : ""}${t.laborDelta} pts`} sub="vs target" tone={t.laborDelta > 1 ? "warn" : "neutral"} />
              <Metric label="Training" value={`${t.trainingDelta}%`} sub="completion delta" tone={t.trainingDelta < 0 ? "warn" : "good"} />
            </div>
            {selected.restaurant.id === TROUBLED_RESTAURANT_ID ? (
              <div className="mt-4 rounded-lg border border-[#7C3AED]/25 bg-[#7C3AED]/[0.05] px-3 py-3 text-sm text-[#101828]/75">
                Sales have declined six consecutive weeks. The deterioration correlates with staffing instability that began
                roughly six weeks ago: turnover rose first, complaints followed two weeks later, and labor drifted above target
                as remaining staff absorbed overtime. Privé recommends a GM performance review and a retention plan before the
                summer LTO launch.
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => dispatch({ type: "assignGmReview" })} disabled={state.gmReviewAssigned}>
                {state.gmReviewAssigned ? "GM review assigned" : "Assign GM performance review"}
              </Button>
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Cross-location">Supply chain risk</SectionTitle>
            <div className="space-y-2">
              {d.supplyChain.map((s) => (
                <div key={s.restaurant.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{s.restaurant.name}</div>
                    <div className="text-xs text-[#101828]/55">
                      {s.shortSkus} SKU(s) projected short · avocados {s.avocadoShortage > 0 ? `short ${s.avocadoShortage}` : "covered"}
                    </div>
                  </div>
                  <Pill tone={s.avocadoShortage > 0 ? "amber" : "teal"}>{s.belowPar ? "Below par" : "At par"}</Pill>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Button variant="ghost" onClick={() => dispatch({ type: "increaseAvocadoOrder" })} disabled={state.avocadoOrderIncreased}>
                {state.avocadoOrderIncreased ? "Friday order increased 14%" : "Increase Friday avocado order 14%"}
              </Button>
            </div>
          </Card>
        </div>

        <Card tone="intel" className="lg:sticky lg:top-6 min-h-[520px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="regional" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
