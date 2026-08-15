import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BRAND, TODAY, fmtDate } from "@/lib/prive/data";
import type { Persona } from "@/lib/prive/store";
import { AskPriveDrawer } from "./AskPrive";

const PERSONAS: Array<{ id: Persona; label: string; to: string; who: string }> = [
  { id: "employee", label: "Employee", to: "/employee", who: "Maya Robinson · Server" },
  { id: "gm", label: "General Manager", to: "/gm", who: "Jordan Ellis · Ballantyne #02" },
  { id: "regional", label: "Regional", to: "/regional", who: "Dana Whitmore · Carolinas" },
  { id: "guest", label: "Guest", to: "/guest", who: "Voice & digital service" },
  { id: "executive", label: "Executive", to: "/executive", who: "Ellis Rourke · COO" },
];

export function PriveShell({
  persona,
  title,
  subtitle,
  children,
}: {
  persona: Persona;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = PERSONAS.find((p) => p.id === persona);

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#101828]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#101828] text-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#5146E5] text-sm font-bold">P</span>
            <span className="text-[15px] font-semibold tracking-tight">
              PRIVÉ<span className="ml-2 text-xs font-normal text-white/45">Restaurant Intelligence</span>
            </span>
          </Link>

          <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto pb-0.5 lg:order-2 lg:mx-0 lg:w-auto lg:overflow-visible">
            {PERSONAS.map((p) => (
              <Link
                key={p.id}
                to={p.to}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  pathname === p.to ? "bg-[#5146E5] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >
                {p.label}
              </Link>
            ))}
            <Link
              to="/integrations"
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                pathname === "/integrations" ? "bg-[#5146E5] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              Integrations
            </Link>
          </nav>

          <div className="order-2 ml-auto text-right text-xs leading-tight text-white/55 lg:order-3">
            <div className="font-medium text-white/85">{active?.who}</div>
            <div>{BRAND}</div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#101828]/40">{fmtDate(TODAY)}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-[#101828]/60">{subtitle}</p>
        </div>
        {children}
      </div>

      <AskPriveDrawer persona={persona} />
    </div>
  );
}
