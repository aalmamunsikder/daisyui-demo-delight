import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Card, Metric, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";

export const Route = createFileRoute("/employee")({
  head: () => ({
    meta: [
      { title: "Employee Workspace — Privé" },
      { name: "description", content: "Shifts, training and instant policy answers for restaurant team members." },
      { property: "og:title", content: "Employee Workspace — Privé" },
      { property: "og:description", content: "Shifts, training and instant policy answers for restaurant team members." },
    ],
  }),
  component: EmployeePage,
});

function EmployeePage() {
  const { derived } = usePrive();
  return (
    <PriveShell
      persona="employee"
      title="Good morning, Maya"
      subtitle="Your shift, your training and answers to anything about working here."
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Next shift" value="10:00 AM" sub="Today · Section 3" />
            <Metric label="Hours this week" value="28.5" sub="of 32 scheduled" />
            <Metric label="Training due" value={`${derived.overdueTraining}`} sub="Assigned modules" tone="warn" />
          </div>
          <Card>
            <SectionTitle hint="Ballantyne #02">Open shift</SectionTitle>
            <p className="text-sm text-[#101828]/70">
              Saturday 4:00–8:00 PM · peak block. Privé forecasts higher traffic and your manager is looking for coverage.
            </p>
          </Card>
        </div>
        <Card tone="intel" className="min-h-[420px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="employee" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
