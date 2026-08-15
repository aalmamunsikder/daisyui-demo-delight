import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, Pill, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";

export const Route = createFileRoute("/guest")({
  head: () => ({
    meta: [
      { title: "Guest Experience — Privé" },
      { name: "description", content: "Voice and digital guest service with drafted recovery held for manager approval." },
      { property: "og:title", content: "Guest Experience — Privé" },
      { property: "og:description", content: "Voice and digital guest service with drafted recovery held for manager approval." },
    ],
  }),
  component: GuestPage,
});

function GuestPage() {
  const { derived: d } = usePrive();
  return (
    <PriveShell persona="guest" title="Guest experience" subtitle="Every guest contact is answered instantly; anything with a cost waits for a manager.">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card>
          <SectionTitle hint={`${d.openComplaints} open`}>Recent guest issues</SectionTitle>
          <div className="space-y-2">
            {d.gmComplaints.slice(0, 6).map((c) => (
              <div key={c.id} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.customer}</span>
                  <Pill tone={c.status === "Awaiting Approval" ? "amber" : "teal"}>{c.status}</Pill>
                </div>
                <p className="mt-1 text-xs text-[#101828]/60">
                  {c.type} · {c.severity} severity
                </p>
              </div>
            ))}
          </div>
        </Card>
        <Card tone="intel" className="min-h-[440px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="guest" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
