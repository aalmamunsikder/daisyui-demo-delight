import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, Pill, SectionTitle, stateTone } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";

export const Route = createFileRoute("/regional")({
  head: () => ({
    meta: [
      { title: "Regional Portfolio — Privé" },
      { name: "description", content: "Location health across the Carolinas region with deterioration signals and root cause." },
      { property: "og:title", content: "Regional Portfolio — Privé" },
      { property: "og:description", content: "Location health across the Carolinas region with deterioration signals and root cause." },
    ],
  }),
  component: RegionalPage,
});

function RegionalPage() {
  const { derived: d } = usePrive();
  return (
    <PriveShell persona="regional" title="Carolinas portfolio" subtitle="Health scores computed from sales trend, turnover, complaints, labor and training.">
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <SectionTitle hint={`${d.health.length} locations`}>Location health</SectionTitle>
          <div className="space-y-2">
            {d.health.map((h) => (
              <div key={h.restaurant.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{h.restaurant.name}</div>
                  <div className="text-xs text-[#101828]/50">{h.restaurant.city}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold tabular-nums">{h.score}</span>
                  <Pill tone={stateTone(h.state)}>{h.state}</Pill>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card tone="intel" className="min-h-[480px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="regional" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
