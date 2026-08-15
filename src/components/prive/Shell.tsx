import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  MessageSquareHeart,
  PanelLeft,
  Plug,
  Store,
  UserRound,
} from "lucide-react";
import { BRAND, TODAY, fmtDate } from "@/lib/prive/data";
import { usePrive, type Persona } from "@/lib/prive/store";
import { AskPriveDrawer } from "./AskPrive";

interface NavItem {
  id: Persona | "integrations";
  label: string;
  to: string;
  who: string;
  icon: typeof UserRound;
}

const WORKSPACES: NavItem[] = [
  { id: "employee", label: "Employee", to: "/employee", who: "Maya Robinson · Server", icon: UserRound },
  { id: "gm", label: "General Manager", to: "/gm", who: "Jordan Ellis · Ballantyne #02", icon: Store },
  { id: "regional", label: "Regional", to: "/regional", who: "Dana Whitmore · Carolinas", icon: Building2 },
  { id: "guest", label: "Guest", to: "/guest", who: "Voice & digital service", icon: MessageSquareHeart },
  { id: "executive", label: "Executive", to: "/executive", who: "Ellis Rourke · COO", icon: BarChart3 },
];

const SYSTEM: NavItem[] = [
  { id: "integrations", label: "Integrations & audit", to: "/integrations", who: "Data sources", icon: Plug },
];

function NavLink({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      title={item.label}
      className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
        active ? "bg-[#5146E5] text-white" : "text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );
}

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
  const { derived: d } = usePrive();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = WORKSPACES.find((p) => p.id === persona);

  const sidebar = (
    <div className="flex h-full flex-col gap-6 bg-[#101828] px-3 py-4 text-white">
      <div className="flex items-center gap-2.5 px-1.5">
        <Link to="/" className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#5146E5] text-sm font-bold">
          P
        </Link>
        {!collapsed ? (
          <Link to="/" className="min-w-0">
            <div className="text-[14px] font-semibold leading-tight tracking-tight">PRIVÉ</div>
            <div className="truncate text-[11px] text-white/45">Restaurant Intelligence</div>
          </Link>
        ) : null}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">Workspaces</p>
          ) : null}
          {WORKSPACES.map((p) => (
            <NavLink key={p.id} item={p} collapsed={collapsed} active={pathname === p.to} />
          ))}
        </div>
        <div className="space-y-1">
          {!collapsed ? (
            <p className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">System</p>
          ) : null}
          {SYSTEM.map((p) => (
            <NavLink key={p.id} item={p} collapsed={collapsed} active={pathname === p.to} />
          ))}
        </div>

        {!collapsed ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Live signal</p>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white/55">Readiness</span>
              <span className="font-semibold tabular-nums">{d.readiness.score}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-[width] duration-700"
                style={{ width: `${d.readiness.score}%`, background: d.readiness.score >= 85 ? "#0F9D8A" : "#F59E0B" }}
              />
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white/55">Open alerts</span>
              <span className="font-semibold tabular-nums">{d.alerts.length}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-white/55">Awaiting you</span>
              <span className="font-semibold tabular-nums">{d.pendingApprovals.filter((p) => !p.done).length}</span>
            </div>
          </div>
        ) : null}
      </nav>

      {!collapsed ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "resetDemo" })}
          className="rounded-lg border border-white/10 px-2.5 py-2 text-[12px] font-medium text-white/50 hover:bg-white/10 hover:text-white"
        >
          Reset demo state
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="hidden items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-white/45 hover:bg-white/10 hover:text-white lg:flex"
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        {!collapsed ? "Collapse" : null}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F2] text-[#101828]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden shrink-0 border-r border-white/10 transition-[width] duration-200 lg:block ${
          collapsed ? "w-[68px]" : "w-[248px]"
        }`}
      >
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[248px]">{sidebar}</div>
        </div>
      ) : null}

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-[68px]" : "lg:pl-[248px]"}`}>
        <header className="sticky top-0 z-30 border-b border-[#101828]/8 bg-[#F7F6F2]/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-[#101828]/12 p-2 lg:hidden"
            >
              <PanelLeft className="size-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[#101828]/40">
                <span>{fmtDate(TODAY)}</span>
                <span aria-hidden>·</span>
                <span className="truncate">{active?.label ?? "Privé"}</span>
              </div>
              <div className="truncate text-sm font-semibold">{active?.who ?? BRAND}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-[#0F9D8A]/12 px-2.5 py-1 text-[11px] font-semibold text-[#0B7A6C] sm:inline-flex">
                <Activity className="size-3.5" /> Live data
              </span>
              <span className="hidden text-xs text-[#101828]/50 md:inline">{BRAND}</span>
            </div>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-[#101828]/60">{subtitle}</p>
          </div>
          {children}
        </main>
      </div>

      <AskPriveDrawer persona={persona} />
    </div>
  );
}
