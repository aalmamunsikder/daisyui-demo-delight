import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { Card, Pill, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations & Audit — Privé" },
      { name: "description", content: "Connected source systems and the human-approval trail behind every Privé action." },
      { property: "og:title", content: "Integrations & Audit — Privé" },
      { property: "og:description", content: "Connected source systems and the human-approval trail behind every Privé action." },
    ],
  }),
  component: IntegrationsPage,
});

const SYSTEMS = [
  ["Toast POS", "Sales, item mix, transactions"],
  ["Paycor", "Payroll, labor cost, turnover"],
  ["7shifts", "Scheduling and availability"],
  ["Restaurant365", "Inventory and purchasing"],
  ["Guest Feedback CRM", "Complaints and recovery"],
  ["Voice AI", "Inbound guest calls"],
];

function IntegrationsPage() {
  const { state } = usePrive();
  return (
    <PriveShell persona="gm" title="Integrations & audit" subtitle="Privé reads from the systems you already run and records every action it takes.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionTitle hint="All connected">Source systems</SectionTitle>
          <div className="space-y-2">
            {SYSTEMS.map(([name, desc]) => (
              <div key={name} className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                <div>
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-xs text-[#101828]/50">{desc}</div>
                </div>
                <Pill tone="teal">Connected</Pill>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionTitle hint={`${state.audit.length} events`}>Audit trail</SectionTitle>
          <div className="space-y-2">
            {state.audit.length === 0 ? (
              <p className="text-sm text-[#101828]/55">No actions recorded yet in this session.</p>
            ) : (
              state.audit.map((a) => (
                <div key={a.id} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{a.action}</span>
                    <Pill tone={a.approval === "Pending" ? "amber" : "teal"}>{a.approval}</Pill>
                  </div>
                  <p className="mt-1 text-xs text-[#101828]/55">
                    {a.at} · {a.actor} · {a.agent} — {a.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PriveShell>
  );
}
