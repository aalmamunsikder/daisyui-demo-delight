import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  tone,
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "intel" | "alert";
}) {
  const toneCls =
    tone === "intel"
      ? "border-[#7C3AED]/25 bg-gradient-to-br from-[#7C3AED]/[0.06] to-transparent"
      : tone === "alert"
        ? "border-[#F59E0B]/35 bg-[#F59E0B]/[0.05]"
        : "border-[#101828]/10 bg-white";
  return (
    <section className={`rounded-2xl border ${toneCls} p-5 shadow-[0_1px_2px_rgba(16,24,40,0.05)] ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.11em] text-[#101828]/55">{children}</h2>
      {hint ? <span className="text-xs text-[#101828]/45">{hint}</span> : null}
    </div>
  );
}

export function Metric({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const color =
    tone === "good" ? "text-[#0F9D8A]" : tone === "warn" ? "text-[#B45309]" : tone === "bad" ? "text-[#DC3545]" : "text-[#101828]";
  return (
    <div className="rounded-xl border border-[#101828]/8 bg-white px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[#101828]/45">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${color}`}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-[#101828]/50">{sub}</div> : null}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  neutral: "bg-[#101828]/6 text-[#101828]/70",
  indigo: "bg-[#5146E5]/10 text-[#5146E5]",
  violet: "bg-[#7C3AED]/10 text-[#7C3AED]",
  teal: "bg-[#0F9D8A]/12 text-[#0B7A6C]",
  amber: "bg-[#F59E0B]/15 text-[#B45309]",
  red: "bg-[#DC3545]/12 text-[#B02A37]",
};

export function Pill({ tone = "neutral", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badgeTones[tone]}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "violet" | "danger" | "quiet";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-[#5146E5] text-white hover:bg-[#4238cf]",
    violet: "bg-[#7C3AED] text-white hover:bg-[#6d28d9]",
    danger: "bg-[#DC3545] text-white hover:bg-[#b02a37]",
    ghost: "border border-[#101828]/15 bg-white text-[#101828] hover:bg-[#101828]/[0.04]",
    quiet: "text-[#5146E5] hover:bg-[#5146E5]/8",
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${styles} ${className}`}>
      {children}
    </button>
  );
}

export function Meter({ value, tone = "indigo" }: { value: number; tone?: "indigo" | "teal" | "amber" | "red" }) {
  const color = { indigo: "#5146E5", teal: "#0F9D8A", amber: "#F59E0B", red: "#DC3545" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#101828]/8">
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

export function ConfidenceTag({ level, pct }: { level: string; pct?: number }) {
  const tone = level === "High" ? "teal" : level === "Medium" ? "amber" : "red";
  return (
    <Pill tone={tone as "teal"}>
      {level} confidence{pct ? ` · ${pct}%` : ""}
    </Pill>
  );
}

export function stateTone(state: string): keyof typeof badgeTones {
  return state === "Healthy" ? "teal" : state === "Watch" ? "amber" : state === "Action Required" ? "amber" : "red";
}
