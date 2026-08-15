import { createFileRoute } from "@tanstack/react-router";
import { PriveShell } from "@/components/prive/Shell";
import { AskPriveConsole } from "@/components/prive/AskPrive";
import { Button, Card, Metric, Pill, SectionTitle } from "@/components/prive/ui";
import { usePrive } from "@/lib/prive/store";
import { CERT_EMPLOYEE, MAYA, ONBOARDING_STEPS, knowledge } from "@/lib/prive/data";

export const Route = createFileRoute("/employee")({
  head: () => ({
    meta: [
      { title: "Employee Workspace — Privé" },
      { name: "description", content: "Shifts, training, onboarding and instant policy answers for restaurant team members." },
      { property: "og:title", content: "Employee Workspace — Privé" },
      { property: "og:description", content: "Shifts, training, onboarding and instant policy answers for restaurant team members." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmployeePage,
});

function EmployeePage() {
  const { state, derived: d, dispatch } = usePrive();

  const steps = ONBOARDING_STEPS.map((s) => ({
    ...s,
    done:
      s.label === "I-9 verification" ? state.i9Complete : s.label === "Food safety training" ? state.mayaTrainingComplete : s.done,
  }));
  const stepsDone = steps.filter((s) => s.done).length;

  return (
    <PriveShell
      persona="employee"
      title={`Good morning, ${MAYA.name.split(" ")[0]}`}
      subtitle="Your shift, your training and answers to anything about working here — no manager required."
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Next shift" value="10:00 AM" sub="Today · Section 3" />
            <Metric label="Hours this week" value="28.5" sub="of 32 scheduled" />
            <Metric
              label="Training due"
              value={state.mayaTrainingComplete ? "0" : "1"}
              sub="Assigned modules"
              tone={state.mayaTrainingComplete ? "good" : "warn"}
            />
          </div>

          <Card tone={state.shiftAccepted ? "default" : "alert"}>
            <SectionTitle hint="Ballantyne #02">Open shift opportunity</SectionTitle>
            <p className="text-sm text-[#101828]/70">
              Saturday 4:00–8:00 PM · peak block. Privé forecasts {d.tomorrow.transactions.toLocaleString()} transactions
              tomorrow ({d.tomorrow.vsTypicalPct > 0 ? "+" : ""}
              {d.tomorrow.vsTypicalPct}% vs typical) and your manager is short {Math.max(d.staffing.gap, 1)} team member(s).
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => dispatch({ type: "acceptShift" })} disabled={state.shiftAccepted}>
                {state.shiftAccepted ? "Interest submitted" : "I'm interested"}
              </Button>
              {state.shiftAccepted ? (
                <Pill tone={state.extraStaffApproved > 0 ? "teal" : "amber"}>
                  {state.extraStaffApproved > 0 ? "Approved by your GM — you're on the schedule" : "Waiting on GM approval"}
                </Pill>
              ) : (
                <span className="text-xs text-[#101828]/50">Approx. 4 hours · $15.50/hr · Server</span>
              )}
            </div>
          </Card>

          <Card>
            <SectionTitle hint={`${stepsDone} of ${steps.length} complete`}>Onboarding</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-2">
              {steps.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#101828]/8 bg-white px-3 py-2 text-sm"
                >
                  <span className={s.done ? "text-[#101828]/60 line-through" : "font-medium"}>{s.label}</span>
                  {s.done ? (
                    <Pill tone="teal">Done</Pill>
                  ) : s.label === "Food safety training" ? (
                    <Button variant="quiet" onClick={() => dispatch({ type: "completeTraining" })}>
                      Start (5 min)
                    </Button>
                  ) : (
                    <Pill tone="amber">With manager</Pill>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-[#101828]/45">
              I-9 verification must be completed in person by your GM — Privé will never self-approve it.
            </p>
          </Card>

          <Card>
            <SectionTitle hint={CERT_EMPLOYEE.name}>Certification watch</SectionTitle>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#101828]/8 bg-white px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">ServSafe food handler</div>
                <div className="text-xs text-[#101828]/55">
                  {state.certificationCompleted ? "Renewed · valid 24 months" : `Expires in ${CERT_EMPLOYEE.certExpiresInDays} days`}
                </div>
              </div>
              <Button
                variant={state.certificationCompleted ? "ghost" : "primary"}
                disabled={state.certificationCompleted}
                onClick={() => dispatch({ type: "completeCertification" })}
              >
                {state.certificationCompleted ? "Complete" : "Complete renewal"}
              </Button>
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Answered without a manager">Common questions</SectionTitle>
            <div className="space-y-2">
              {knowledge.map((k) => (
                <details key={k.q} className="rounded-lg border border-[#101828]/8 bg-white px-3 py-2">
                  <summary className="cursor-pointer text-sm font-medium capitalize">{k.q}</summary>
                  <p className="mt-2 text-sm text-[#101828]/70">{k.a}</p>
                  <p className="mt-2 text-[11px] text-[#101828]/45">Source: {k.source}</p>
                </details>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle hint="Former employee self-service">After you leave</SectionTitle>
            <p className="text-sm text-[#101828]/70">
              Former team members keep access to pay stubs, W-2s and employment verification letters. Confirm your mailing
              address so tax documents reach you.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => dispatch({ type: "verifyW2Address" })} disabled={state.w2AddressVerified}>
                {state.w2AddressVerified ? "Address confirmed" : "Confirm mailing address"}
              </Button>
              <Pill tone="neutral">W-2 available January 31</Pill>
            </div>
          </Card>
        </div>

        <Card tone="intel" className="lg:sticky lg:top-6 min-h-[520px]">
          <SectionTitle>Ask Privé</SectionTitle>
          <AskPriveConsole persona="employee" compact />
        </Card>
      </div>
    </PriveShell>
  );
}
