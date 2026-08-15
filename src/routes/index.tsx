import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Privé — Restaurant Intelligence Platform" },
      { name: "description", content: "A cognitive layer over POS, payroll, inventory and guest systems for The Morning Table Restaurant Group." },
      { property: "og:title", content: "Privé — Restaurant Intelligence Platform" },
      { property: "og:description", content: "Forecasting, workforce and guest intelligence across 47 restaurants." },
    ],
  }),
  component: Home,
});

const ENTRIES = [
  { to: "/employee", label: "Employee", who: "Maya Robinson · Server", desc: "Shifts, training, policy answers and shift pickup." },
  { to: "/gm", label: "General Manager", who: "Jordan Ellis · Ballantyne #02", desc: "Readiness score, staffing, inventory and guest recovery." },
  { to: "/regional", label: "Regional Director", who: "Dana Whitmore · Carolinas", desc: "Portfolio health and location-level deterioration." },
  { to: "/guest", label: "Guest", who: "Voice & digital service", desc: "Reservations, orders and service recovery." },
  { to: "/executive", label: "Executive", who: "Ellis Rourke · COO", desc: "Margin, scenarios and enterprise forecasting." },
  { to: "/integrations", label: "Integrations & Audit", who: "Platform", desc: "Connected systems and the human-approval trail." },
] as const;

function Home() {
  return (
    <main className="min-h-screen bg-[#101828] text-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#5146E5] font-bold">P</span>
          <span className="text-lg font-semibold tracking-tight">PRIVÉ</span>
        </div>
        <h1 className="mt-10 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          The intelligence layer for The Morning Table Restaurant Group.
        </h1>
        <p className="mt-4 max-w-2xl text-white/60">
          47 restaurants. One cognitive layer over POS, payroll, scheduling, inventory and guest systems —
          answering questions, forecasting outcomes and recommending action, always with human approval.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {ENTRIES.map((e) => (
            <Link
              key={e.to}
              to={e.to}
              className="group rounded-2xl border border-white/12 bg-white/[0.03] p-5 transition-colors hover:border-[#5146E5] hover:bg-white/[0.06]"
            >
              <div className="text-sm font-semibold">{e.label}</div>
              <div className="mt-0.5 text-xs text-[#8b83ff]">{e.who}</div>
              <p className="mt-2 text-sm text-white/55">{e.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
