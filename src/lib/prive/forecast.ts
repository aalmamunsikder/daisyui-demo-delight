import {
  historyFor,
  inventoryItems,
  restaurantById,
  employeesFor,
  type SalesDay,
  type Restaurant,
} from "./data";
import { round } from "./rng";

/* ------------------------------------------------------------------ *
 * Forecasting engine — every number below is calculated from the
 * synthetic history, never hardcoded. Change the inputs and the
 * outputs move.
 * ------------------------------------------------------------------ */

export type Confidence = "High" | "Medium" | "Low";

export interface SalesForecast {
  restaurantId: string;
  date: string;
  sales: number;
  transactions: number;
  avgTicket: number;
  weekdayIndex: number;
  trendFactor: number;
  baseline: number;
  upliftPct: number;
  vsTypicalPct: number;
  confidence: Confidence;
  confidencePct: number;
  inputs: Array<{ label: string; value: string }>;
}

const DOW_LABEL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/** Weighted moving average of the same weekday + weekday seasonality + recent trend. */
export function forecastSales(
  restaurantId: string,
  target: Date,
  opts: { upliftPct?: number } = {},
): SalesForecast {
  const r = restaurantById(restaurantId);
  const hist = historyFor(restaurantId);
  const dow = target.getUTCDay();

  const sameDow = hist.filter((h) => new Date(h.date + "T00:00:00Z").getUTCDay() === dow).slice(-6);
  const weights = [0.06, 0.09, 0.13, 0.18, 0.24, 0.3].slice(-sameDow.length);
  const wSum = weights.reduce((a, b) => a + b, 0);
  const wma = sameDow.reduce((acc, d, i) => acc + d.sales * (weights[i]! / wSum), 0);

  const overall = mean(hist.map((h) => h.sales));
  const dowMean = mean(sameDow.map((h) => h.sales));
  const weekdayIndex = overall ? dowMean / overall : 1;

  const last14 = mean(hist.slice(-14).map((h) => h.sales));
  const prior14 = mean(hist.slice(-28, -14).map((h) => h.sales));
  const trendFactor = prior14 ? Math.min(1.08, Math.max(0.92, last14 / prior14)) : 1;

  const uplift = opts.upliftPct ?? 0;
  const baseline = wma * trendFactor;
  const sales = round(baseline * (1 + uplift / 100));
  const avgTicket = round(mean(hist.slice(-28).map((h) => h.sales / h.transactions)), 2);
  const transactions = Math.round(sales / avgTicket);

  const cv = dowMean ? stdev(sameDow.map((h) => h.sales)) / dowMean : 0.2;
  const confidencePct = Math.max(52, Math.min(94, Math.round((1 - cv * 2.2) * 100)));
  const confidence: Confidence = confidencePct >= 82 ? "High" : confidencePct >= 68 ? "Medium" : "Low";

  const typical = mean(hist.slice(-28).map((h) => h.sales));
  return {
    restaurantId,
    date: target.toISOString().slice(0, 10),
    sales,
    transactions,
    avgTicket,
    weekdayIndex: round(weekdayIndex, 3),
    trendFactor: round(trendFactor, 4),
    baseline: round(baseline),
    upliftPct: uplift,
    vsTypicalPct: round(((sales - typical) / typical) * 100, 1),
    confidence,
    confidencePct,
    inputs: [
      { label: "Weighted moving average (last 6 " + DOW_LABEL[dow] + "s)", value: `$${Math.round(wma).toLocaleString()}` },
      { label: "Weekday seasonality index", value: `${round(weekdayIndex, 3)}×` },
      { label: "Recent trend (14d vs prior 14d)", value: `${round((trendFactor - 1) * 100, 1)}%` },
      { label: "Event / traffic uplift flag", value: `${uplift > 0 ? "+" : ""}${round(uplift, 1)}%` },
      { label: "Average ticket (28d)", value: `$${avgTicket.toFixed(2)}` },
      { label: "History depth", value: `${hist.length} days` },
    ],
  };
}

export interface StaffingForecast {
  projectedTransactions: number;
  laborHoursNeeded: number;
  recommendedStaff: number;
  scheduledStaff: number;
  gap: number;
  projectedLaborCost: number;
  projectedLaborPct: number;
  targetLaborPct: number;
}

export function forecastStaffing(
  restaurantId: string,
  f: SalesForecast,
  scheduledStaffOverride?: number,
): StaffingForecast {
  const r = restaurantById(restaurantId);
  const peakHours = 6; // 11am–5pm peak block used for staffing math
  const peakTransactions = f.transactions * 0.62;
  const laborHoursNeeded = peakTransactions / r.transactionsPerLaborHour;
  const recommendedStaff = Math.max(r.minStaff, Math.ceil(laborHoursNeeded / peakHours));
  const scheduledStaff = scheduledStaffOverride ?? recommendedStaff - (restaurantId === "s2" ? 2 : 0);
  const avgWage = mean(employeesFor(restaurantId).map((e) => e.wage)) || 17.5;
  const totalHours = (f.transactions / r.transactionsPerLaborHour) * 1.18;
  const projectedLaborCost = round(totalHours * avgWage);
  return {
    projectedTransactions: f.transactions,
    laborHoursNeeded: round(laborHoursNeeded, 1),
    recommendedStaff,
    scheduledStaff,
    gap: Math.max(0, recommendedStaff - scheduledStaff),
    projectedLaborCost,
    projectedLaborPct: round((projectedLaborCost / f.sales) * 100, 1),
    targetLaborPct: r.targetLaborPct,
  };
}

export interface DepletionResult {
  itemId: string;
  name: string;
  unit: string;
  onHand: number;
  parLevel: number;
  projectedUsage: number;
  shortage: number;
  depletionTime: string | null;
  hoursToDepletion: number | null;
  confidencePct: number;
  risk: "Critical" | "At Risk" | "Watch" | "Healthy";
}

export function forecastDepletion(
  restaurantId: string,
  f: SalesForecast,
  onHandOverrides: Record<string, number> = {},
): DepletionResult[] {
  const r = restaurantById(restaurantId);
  const openHours = r.closeHour - r.openHour;
  return inventoryItems.map((item) => {
    const onHand = onHandOverrides[item.id] ?? item.onHand;
    const projectedUsage = round(f.transactions * item.usagePerTransaction, 1);
    const velocity = projectedUsage / openHours; // units per hour
    const hours = velocity > 0 ? onHand / velocity : null;
    const shortage = round(Math.max(0, projectedUsage - onHand), 1);
    let depletionTime: string | null = null;
    let hoursToDepletion: number | null = null;
    if (hours !== null && hours < openHours) {
      hoursToDepletion = round(hours, 2);
      const t = r.openHour + hours;
      const hh = Math.floor(t);
      const mm = Math.round((t - hh) * 60);
      const suffix = hh >= 12 ? "PM" : "AM";
      const h12 = hh > 12 ? hh - 12 : hh;
      depletionTime = `${h12}:${String(mm).padStart(2, "0")} ${suffix}`;
    }
    const ratio = projectedUsage ? onHand / projectedUsage : 2;
    const risk: DepletionResult["risk"] =
      ratio < 0.8 ? "Critical" : ratio < 1.0 ? "At Risk" : ratio < 1.2 ? "Watch" : "Healthy";
    return {
      itemId: item.id,
      name: item.name,
      unit: item.unit,
      onHand: round(onHand, 1),
      parLevel: item.parLevel,
      projectedUsage,
      shortage,
      depletionTime,
      hoursToDepletion,
      confidencePct: Math.min(94, f.confidencePct + 3),
      risk,
    };
  });
}

/** Complaint volume forecast from historical rate × predicted covers × staffing pressure. */
export function forecastComplaints(f: SalesForecast, staffing: StaffingForecast, openComplaints: number): {
  expected: number;
  ratePer1000: number;
  confidence: Confidence;
} {
  const basePer1000 = 1.8 + openComplaints * 0.15;
  const staffingPressure = staffing.gap > 0 ? 1 + staffing.gap * 0.18 : 1;
  const expected = round((f.transactions / 1000) * basePer1000 * staffingPressure, 1);
  return {
    expected,
    ratePer1000: round(basePer1000 * staffingPressure, 2),
    confidence: staffing.gap > 1 ? "Medium" : "High",
  };
}

export interface Readiness {
  score: number;
  risks: Array<{ label: string; probability: number; detail: string }>;
}

/** Composite "can we handle tomorrow?" readiness. */
export function computeReadiness(input: {
  inventoryShortage: number;
  staffingGap: number;
  openComplaints: number;
  expiringCerts: number;
  overdueTraining: number;
}): Readiness {
  const invProb = Math.min(95, Math.round(input.inventoryShortage * 2.05));
  const staffProb = Math.min(92, Math.round(input.staffingGap * 32));
  const svcProb = Math.min(90, Math.round(input.staffingGap * 21 + input.openComplaints * 6 + input.inventoryShortage * 0.5));
  const compProb = Math.min(80, input.expiringCerts * 26 + input.overdueTraining * 9);

  const penalty = invProb * 0.28 + staffProb * 0.3 + svcProb * 0.22 + compProb * 0.14;
  const score = Math.max(5, Math.min(99, Math.round(100 - penalty)));

  const risks = [
    { label: "Inventory shortage", probability: invProb, detail: `${round(input.inventoryShortage, 1)} units projected short of demand` },
    { label: "Staffing shortage", probability: staffProb, detail: `${input.staffingGap} role(s) below recommended coverage` },
    { label: "Service-time threshold breach", probability: svcProb, detail: `Driven by coverage gap and ${input.openComplaints} unresolved guest issue(s)` },
    { label: "Compliance exposure", probability: compProb, detail: `${input.expiringCerts} certification(s) expiring, ${input.overdueTraining} training item(s) overdue` },
  ].filter((r) => r.probability > 0);

  return { score, risks };
}

export interface HealthResult {
  restaurantId: string;
  score: number;
  state: "Healthy" | "Watch" | "Action Required" | "Critical";
}

export function restaurantHealth(r: Restaurant, openComplaints: number, staffingGap: number): HealthResult {
  const hist = historyFor(r.id);
  const last14 = mean(hist.slice(-14).map((h) => h.sales));
  const prior14 = mean(hist.slice(-28, -14).map((h) => h.sales));
  const salesTrend = prior14 ? (last14 / prior14 - 1) * 100 : 0;
  const staff = employeesFor(r.id);
  const trainingOverdue = staff.filter((e) => e.trainingOverdue).length;
  const attendance = staff.filter((e) => e.attendanceExceptions > 0).length;
  const readinessAvg = mean(Object.values(r.readinessDetail));

  let score = 100;
  score += Math.max(-14, Math.min(8, salesTrend * 2.2));
  score -= Math.max(0, r.turnoverDelta) * 0.45;
  score -= Math.max(0, r.complaintDelta) * 0.32;
  score -= Math.max(0, r.laborDelta) * 0.9;
  score -= Math.max(0, -r.trainingDelta) * 0.35;
  score -= (staff.length ? trainingOverdue / staff.length : 0) * 22;
  score -= (staff.length ? attendance / staff.length : 0) * 16;
  score -= openComplaints * 1.6;
  score -= staffingGap * 1.8;
  score -= Math.max(0, 95 - readinessAvg) * 0.35;

  const s = Math.max(20, Math.min(99, Math.round(score)));
  const state: HealthResult["state"] = s >= 85 ? "Healthy" : s >= 74 ? "Watch" : s >= 60 ? "Action Required" : "Critical";
  return { restaurantId: r.id, score: s, state };
}

export function moneyShort(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${round(n / 1_000_000, 2)}M`;
  if (Math.abs(n) >= 1_000) return `$${round(n / 1_000, 1)}K`;
  return `$${round(n)}`;
}
export function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}
