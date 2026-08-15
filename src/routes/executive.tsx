import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, Metric, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { money } from "@/lib/prive/forecast";

export const Route = createFileRoute("/executive")({
  head: () => ({
    meta: [
      { title: "Executive Intelligence — Privé" },
      { name: "description", content: "Enterprise revenue, labor and margin forecasting with scenario modeling across 47 restaurants." },
      { property: "og:title", content: "Executive Intelligence — Privé" },
      { property: "og:description", content: "Enterprise revenue, labor and margin forecasting with scenario modeling across 47 restaurants." },
    ],
  }),
  component: ExecutivePage,
});

function ExecutivePage() {
  const { derived: d } = usePrive();
  const e = d.enterprise;
  return (
    <PriveShell persona="executive" title="Enterprise intelligence" subtitle="47 restaurants, one forecast — computed from the same historical series the operators see.">
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Month revenue" value={money(e.monthRevenue)} sub="Ahead of plan" tone="good" />
            <Metric label="Labor" value={`${e.laborPct}%`} sub="Target 25.6%" tone="warn" />
            <Metric label="Turnover risk" value={`${e.turnoverRiskStores}`} sub="Locations elevated" tone="warn" />
          </div>
          <Card tone="alert">
            <SectionTitle>Margin pressure</SectionTitle>
            <p className="text-sm text-[#101828]/70">
              Revenue is ahead of plan while margin runs 1.2 points behind: labor above target, protein cost up 6.2%,
              and {money(e.recoverySpend)} of service recovery issued this period.
            </p>
          </Card>
        </div>
        <Card tone="intel" className="min-h-[480px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="executive" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
