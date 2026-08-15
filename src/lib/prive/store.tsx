import { createContext, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from "react";
import {
  CERT_EMPLOYEE,
  GM_RESTAURANT_ID,
  JORDAN_SEPARATION,
  MAYA,
  TODAY,
  TOMORROW,
  TROUBLED_RESTAURANT_ID,
  announcements,
  complaints as seedComplaints,
  employeesFor,
  inventoryItems,
  restaurantById,
  restaurants,
  type Complaint,
} from "./data";
import {
  computeReadiness,
  forecastComplaints,
  forecastDepletion,
  forecastSales,
  forecastStaffing,
  restaurantHealth,
} from "./forecast";
import { round } from "./rng";

export type Persona = "employee" | "gm" | "regional" | "guest" | "executive";

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  agent: string;
  action: string;
  detail: string;
  approval: "Manager approved" | "Automatic (low risk)" | "Pending";
}

export interface GiftCredit {
  code: string;
  amount: number;
  complaintId: string;
  customer: string;
  issuedBy: string;
  issuedAt: string;
  expires: string;
  restaurantId: string;
  singleUse: boolean;
  redeemed: boolean;
}

interface State {
  persona: Persona;
  regionalRestaurantId: string;
  // Cross-persona mutable state
  shiftAccepted: boolean;
  extraStaffApproved: number;
  potatoOrderIncrease: number;
  certificationCompleted: boolean;
  mayaTrainingComplete: boolean;
  i9Complete: boolean;
  complaints: Complaint[];
  giftCredits: GiftCredit[];
  audit: AuditEvent[];
  scenarioUplift: number; // executive what-if, in %
  tomorrowUplift: number; // baseline predicted traffic uplift for tomorrow
  shiftOfferSent: boolean;
  separationDecision: string | null;
  acknowledged: string[];
  dismissedAlerts: string[];
  gmReviewAssigned: boolean;
  avocadoOrderIncreased: boolean;
  w2AddressVerified: boolean;
}

type Action =
  | { type: "persona"; persona: Persona }
  | { type: "regionalRestaurant"; id: string }
  | { type: "sendShiftOffer" }
  | { type: "acceptShift" }
  | { type: "approveStaffing" }
  | { type: "increasePotatoOrder"; lbs: number }
  | { type: "transferInventory"; lbs: number }
  | { type: "completeCertification" }
  | { type: "completeTraining" }
  | { type: "completeI9" }
  | { type: "resolveComplaint"; id: string; amount: number }
  | { type: "rejectComplaint"; id: string }
  | { type: "escalateComplaint"; id: string }
  | { type: "redeemCredit"; code: string }
  | { type: "createComplaint"; complaint: Complaint }
  | { type: "scenario"; uplift: number }
  | { type: "separation"; decision: string }
  | { type: "acknowledge"; id: string; title: string }
  | { type: "dismissAlert"; id: string }
  | { type: "assignGmReview" }
  | { type: "increaseAvocadoOrder" }
  | { type: "verifyW2Address" }
  | { type: "audit"; event: Omit<AuditEvent, "id" | "at"> };

const now = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

let auditSeq = 100;
const logEvent = (e: Omit<AuditEvent, "id" | "at">): AuditEvent => ({
  ...e,
  id: `au${++auditSeq}`,
  at: now(),
});

const withLog = (state: State, e: Omit<AuditEvent, "id" | "at">) => [logEvent(e), ...state.audit];

let codeSeq = 0;
function code(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if (i % 4 === 3 && i < 11) out += "-";
  }
  // sequence suffix guarantees uniqueness (fraud control: no duplicate codes)
  return `MT-${out}-${String(++codeSeq).padStart(2, "0")}`;
}

const initialState: State = {
  persona: "gm",
  regionalRestaurantId: TROUBLED_RESTAURANT_ID,
  shiftAccepted: false,
  extraStaffApproved: 0,
  potatoOrderIncrease: 0,
  certificationCompleted: false,
  mayaTrainingComplete: false,
  i9Complete: false,
  complaints: seedComplaints,
  giftCredits: [],
  audit: [
    {
      id: "au1",
      at: "6:02 AM",
      actor: "System",
      agent: "Forecast Agent",
      action: "Generated daily forecast set",
      detail: "12 restaurants · sales, transactions, labor, inventory depletion",
      approval: "Automatic (low risk)",
    },
    {
      id: "au2",
      at: "6:04 AM",
      actor: "System",
      agent: "Alert Agent",
      action: "Prioritized operational alerts",
      detail: "5 alerts surfaced for Ballantyne #02 morning brief",
      approval: "Automatic (low risk)",
    },
  ],
  scenarioUplift: 10,
  tomorrowUplift: 18,
  shiftOfferSent: false,
  separationDecision: null,
  acknowledged: [],
  dismissedAlerts: [],
  gmReviewAssigned: false,
  avocadoOrderIncreased: false,
  w2AddressVerified: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "persona":
      return { ...state, persona: action.persona };
    case "regionalRestaurant":
      return { ...state, regionalRestaurantId: action.id };
    case "sendShiftOffer":
      if (state.shiftOfferSent) return state;
      return {
        ...state,
        shiftOfferSent: true,
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Scheduling Agent",
          action: "Broadcast open-shift opportunity",
          detail: "Saturday 4:00–8:00 PM · qualified servers · Ballantyne #02",
          approval: "Manager approved",
        }),
      };
    case "acceptShift":
      if (state.shiftAccepted) return state;
      return {
        ...state,
        shiftAccepted: true,
        audit: withLog(state, {
          actor: "Maya Robinson (Employee)",
          agent: "Scheduling Agent",
          action: "Shift interest submitted",
          detail: "Saturday 4:00–8:00 PM · routed to GM for approval",
          approval: "Pending",
        }),
      };
    case "approveStaffing":
      if (state.extraStaffApproved >= 2) return state;
      return {
        ...state,
        extraStaffApproved: Math.min(2, state.extraStaffApproved + (state.shiftAccepted ? 2 : 1)),
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Scheduling Agent",
          action: "Approved staffing adjustment",
          detail: state.shiftAccepted
            ? "Maya Robinson + 1 qualified server added to Saturday 4:00–8:00 PM"
            : "Added one team member to Saturday 4:00–8:00 PM peak block",
          approval: "Manager approved",
        }),
      };
    case "increasePotatoOrder":
      return {
        ...state,
        potatoOrderIncrease: state.potatoOrderIncrease + action.lbs,
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Inventory Agent",
          action: "Increased supplier order",
          detail: `Russet Potatoes +${action.lbs} lbs · Carolina Produce Co. · next-day delivery`,
          approval: "Manager approved",
        }),
      };
    case "transferInventory":
      return {
        ...state,
        potatoOrderIncrease: state.potatoOrderIncrease + action.lbs,
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Supply Chain Agent",
          action: "Cross-store transfer requested",
          detail: `Russet Potatoes +${action.lbs} lbs transferring from Charlotte #01 (11 miles)`,
          approval: "Manager approved",
        }),
      };
    case "completeCertification":
      if (state.certificationCompleted) return state;
      return {
        ...state,
        certificationCompleted: true,
        audit: withLog(state, {
          actor: "Andre Vega (Employee)",
          agent: "Compliance Agent",
          action: "Certification renewed",
          detail: "ServSafe food handler · expiry extended 24 months",
          approval: "Automatic (low risk)",
        }),
      };
    case "completeTraining":
      if (state.mayaTrainingComplete) return state;
      return {
        ...state,
        mayaTrainingComplete: true,
        audit: withLog(state, {
          actor: "Maya Robinson (Employee)",
          agent: "Training Agent",
          action: "Completed assigned training",
          detail: "Allergen Awareness (5 min) · onboarding step cleared",
          approval: "Automatic (low risk)",
        }),
      };
    case "completeI9":
      if (state.i9Complete) return state;
      return {
        ...state,
        i9Complete: true,
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Onboarding Agent",
          action: "I-9 verification recorded",
          detail: "Maya Robinson · documents verified in person, synced to Paycor",
          approval: "Manager approved",
        }),
      };
    case "resolveComplaint": {
      const c = state.complaints.find((x) => x.id === action.id);
      if (!c || c.status === "Resolved") return state;
      const credit: GiftCredit = {
        code: code(),
        amount: action.amount,
        complaintId: c.id,
        customer: c.customer,
        issuedBy: "Jordan Ellis (GM)",
        issuedAt: new Date().toISOString().slice(0, 10),
        expires: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        restaurantId: c.restaurantId,
        singleUse: true,
        redeemed: false,
      };
      return {
        ...state,
        complaints: state.complaints.map((x) => (x.id === action.id ? { ...x, status: "Resolved" } : x)),
        giftCredits: [credit, ...state.giftCredits],
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Guest Recovery Agent",
          action: `Approved guest recovery — $${action.amount}`,
          detail: `${c.customer} · ${c.type} · credit ${credit.code} issued and response sent`,
          approval: "Manager approved",
        }),
      };
    }
    case "rejectComplaint": {
      const c = state.complaints.find((x) => x.id === action.id);
      if (!c) return state;
      return {
        ...state,
        complaints: state.complaints.map((x) => (x.id === action.id ? { ...x, status: "Rejected" } : x)),
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Guest Recovery Agent",
          action: "Rejected drafted recovery",
          detail: `${c.customer} · ${c.type} · no compensation issued, apology only`,
          approval: "Manager approved",
        }),
      };
    }
    case "escalateComplaint": {
      const c = state.complaints.find((x) => x.id === action.id);
      if (!c) return state;
      return {
        ...state,
        complaints: state.complaints.map((x) => (x.id === action.id ? { ...x, status: "Escalated" } : x)),
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Guest Recovery Agent",
          action: "Escalated to regional director",
          detail: `${c.customer} · ${c.type} · exceeds local approval threshold`,
          approval: "Pending",
        }),
      };
    }
    case "redeemCredit": {
      const g = state.giftCredits.find((x) => x.code === action.code);
      if (!g || g.redeemed) return state;
      return {
        ...state,
        giftCredits: state.giftCredits.map((x) => (x.code === action.code ? { ...x, redeemed: true } : x)),
        audit: withLog(state, {
          actor: "Guest",
          agent: "Gift Credit Agent",
          action: "Recovery credit redeemed",
          detail: `${g.code} · $${g.amount} · single-use code marked redeemed`,
          approval: "Automatic (low risk)",
        }),
      };
    }
    case "createComplaint":
      return {
        ...state,
        complaints: [action.complaint, ...state.complaints],
        audit: withLog(state, {
          actor: "Guest (Voice)",
          agent: "Voice AI Agent",
          action: "Complaint intake created",
          detail: `${action.complaint.customer} · ${action.complaint.type} · routed to GM, Ballantyne #02`,
          approval: "Automatic (low risk)",
        }),
      };
    case "scenario":
      return { ...state, scenarioUplift: action.uplift };
    case "separation":
      return {
        ...state,
        separationDecision: action.decision,
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Workforce Agent",
          action: `Separation review decision — ${action.decision}`,
          detail: "Jordan Smith · 45 days without a scheduled shift · human decision required",
          approval: "Manager approved",
        }),
      };
    case "acknowledge":
      if (state.acknowledged.includes(action.id)) return state;
      return {
        ...state,
        acknowledged: [...state.acknowledged, action.id],
        audit: withLog(state, {
          actor: "Jordan Ellis (GM)",
          agent: "Communications Agent",
          action: "Acknowledged corporate communication",
          detail: action.title,
          approval: "Manager approved",
        }),
      };
    case "dismissAlert":
      return { ...state, dismissedAlerts: [...state.dismissedAlerts, action.id] };
    case "assignGmReview":
      if (state.gmReviewAssigned) return state;
      return {
        ...state,
        gmReviewAssigned: true,
        audit: withLog(state, {
          actor: "Dana Whitmore (Regional)",
          agent: "Workforce Agent",
          action: "Assigned GM performance review",
          detail: "Charlotte #04 · retention plan requested before summer LTO launch",
          approval: "Manager approved",
        }),
      };
    case "increaseAvocadoOrder":
      if (state.avocadoOrderIncreased) return state;
      return {
        ...state,
        avocadoOrderIncreased: true,
        audit: withLog(state, {
          actor: "Dana Whitmore (Regional)",
          agent: "Supply Chain Agent",
          action: "Increased Friday avocado order 14%",
          detail: "Charlotte #01, Ballantyne #02, Charlotte #04 · Gulf Fresh Distribution",
          approval: "Manager approved",
        }),
      };
    case "verifyW2Address":
      if (state.w2AddressVerified) return state;
      return {
        ...state,
        w2AddressVerified: true,
        audit: withLog(state, {
          actor: "Former employee",
          agent: "Former Employee Agent",
          action: "Mailing address confirmed for tax documents",
          detail: "Jordan Smith · address and email re-verified via SMS link",
          approval: "Automatic (low risk)",
        }),
      };
    case "audit":
      return { ...state, audit: withLog(state, action.event) };
    default:
      return state;
  }
}

/* ------------------------- Derived intelligence ------------------------- */

export type AlertType = "Critical" | "Action Required" | "Predictive" | "Opportunity" | "Informational";
export interface OpAlert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  priority: number;
  impact: string;
}

export function derive(state: State) {
  const rid = GM_RESTAURANT_ID;
  const restaurant = restaurantById(rid);
  const today = forecastSales(rid, TODAY);
  const tomorrow = forecastSales(rid, TOMORROW, { upliftPct: state.tomorrowUplift });

  const potatoOnHand = (inventoryItems[0]!.onHand ?? 82) + state.potatoOrderIncrease;
  const depletion = forecastDepletion(rid, tomorrow, { i1: potatoOnHand });
  const potato = depletion.find((d) => d.itemId === "i1")!;
  const atRisk = depletion.filter((d) => d.risk === "Critical" || d.risk === "At Risk");

  const baseStaffing = forecastStaffing(rid, tomorrow);
  const staffing = forecastStaffing(rid, tomorrow, baseStaffing.scheduledStaff + state.extraStaffApproved);

  const gmComplaints = state.complaints.filter((c) => c.restaurantId === rid);
  const openComplaints = gmComplaints.filter(
    (c) => c.status === "Open" || c.status === "Awaiting Approval" || c.status === "Escalated",
  ).length;
  const awaitingApproval = gmComplaints.filter((c) => c.status === "Awaiting Approval").length;
  const complaintForecast = forecastComplaints(tomorrow, staffing, openComplaints);

  const expiringCerts = state.certificationCompleted ? 0 : 1;
  const overdueTraining =
    employeesFor(rid).filter((e) => e.trainingOverdue && e.id !== MAYA.id).length +
    (state.mayaTrainingComplete ? 0 : 1);

  const readiness = computeReadiness({
    inventoryShortage: atRisk.reduce((a, d) => a + d.shortage, 0),
    staffingGap: staffing.gap,
    openComplaints,
    expiringCerts,
    overdueTraining: Math.min(4, overdueTraining),
  });

  const health = restaurants.map((r) => {
    const oc = state.complaints.filter(
      (c) => c.restaurantId === r.id && c.status !== "Resolved" && c.status !== "Rejected",
    ).length;
    const gap = r.id === rid ? staffing.gap : 0;
    return { restaurant: r, ...restaurantHealth(r, oc, gap) };
  });

  /* ------------------------- Workforce (GM store) ------------------------ */
  const roster = employeesFor(rid);
  const workforce = {
    total: roster.length,
    active: roster.filter((e) => e.status === "Active").length,
    onboarding: roster.filter((e) => e.status === "Onboarding").length,
    onLeave: roster.filter((e) => e.status === "Leave").length,
    openRoles: 4,
    trainingOverdue: overdueTraining,
    attendanceExceptions: roster.reduce((a, e) => a + e.attendanceExceptions, 0),
    certExpiring: (state.certificationCompleted ? 0 : 1) + roster.filter((e) => e.certExpiresInDays !== null && e.id !== CERT_EMPLOYEE.id && e.certExpiresInDays <= 30).length,
    separationReviews: state.separationDecision ? 0 : 1,
    trainingCompletionPct: round(
      ((roster.length - overdueTraining) / Math.max(1, roster.length)) * 100,
      1,
    ),
    avgTenureMonths: round(roster.reduce((a, e) => a + e.tenureMonths, 0) / Math.max(1, roster.length), 1),
  };

  /* ---------------------------- Enterprise ------------------------------ */
  const enterpriseToday = restaurants.map((r) => forecastSales(r.id, TODAY));
  const enterpriseRevenue = enterpriseToday.reduce((a, f) => a + f.sales, 0);
  const monthRevenue = enterpriseRevenue * 30;
  const recoverySpend = state.giftCredits.reduce((a, g) => a + g.amount, 0);
  const laborPct =
    restaurants.reduce((a, r) => {
      const f = forecastSales(r.id, TODAY);
      return a + forecastStaffing(r.id, f).projectedLaborPct;
    }, 0) / restaurants.length;
  const sameStoreSalesPct = round(
    (enterpriseToday.reduce((a, f) => a + f.trendFactor, 0) / enterpriseToday.length - 1) * 100,
    1,
  );
  const foodCostPct = round(29.4 + (laborPct - 25.6) * 0.15, 1);
  const marginDelta = round(-(laborPct - 25.6) * 0.7 - recoverySpend / 5000, 1);
  const openEnterpriseComplaints = state.complaints.filter(
    (c) => c.status !== "Resolved" && c.status !== "Rejected",
  ).length;
  const sentiment = round(4.4 - openEnterpriseComplaints * 0.04, 2);
  const forecastVariance = round(
    enterpriseToday.reduce((a, f) => a + Math.abs(f.vsTypicalPct), 0) / enterpriseToday.length,
    1,
  );

  /* ------------------------- What-if scenario --------------------------- */
  const scenarioBase = restaurants.map((r) => forecastSales(r.id, TOMORROW));
  const scenarioUp = restaurants.map((r) => forecastSales(r.id, TOMORROW, { upliftPct: state.scenarioUplift }));
  const baseRev = scenarioBase.reduce((a, f) => a + f.sales, 0);
  const upRev = scenarioUp.reduce((a, f) => a + f.sales, 0);
  const baseTx = scenarioBase.reduce((a, f) => a + f.transactions, 0);
  const upTx = scenarioUp.reduce((a, f) => a + f.transactions, 0);
  const baseLaborHours = restaurants.reduce(
    (a, r, i) => a + forecastStaffing(r.id, scenarioBase[i]!).laborHoursNeeded,
    0,
  );
  const upLaborHours = restaurants.reduce(
    (a, r, i) => a + forecastStaffing(r.id, scenarioUp[i]!).laborHoursNeeded,
    0,
  );
  const upStaffGap = restaurants.reduce((a, r, i) => {
    const s = forecastStaffing(r.id, scenarioUp[i]!, forecastStaffing(r.id, scenarioBase[i]!).scheduledStaff);
    return a + s.gap;
  }, 0);
  const inventoryExposure = restaurants.reduce((a, r, i) => {
    const dep = forecastDepletion(r.id, scenarioUp[i]!);
    return a + dep.filter((d) => d.shortage > 0).length;
  }, 0);
  const scenario = {
    upliftPct: state.scenarioUplift,
    revenueDelta: round(upRev - baseRev),
    revenueTotal: round(upRev),
    transactionDelta: upTx - baseTx,
    laborHoursDelta: round(upLaborHours - baseLaborHours, 1),
    extraStaffNeeded: upStaffGap,
    inventoryExposureSkus: inventoryExposure,
    serviceRiskPct: Math.min(88, Math.round(18 + state.scenarioUplift * 2.1 + upStaffGap * 1.4)),
    confidence: tomorrow.confidence,
  };

  /* --------------------------- Supply chain ----------------------------- */
  const carolinas = restaurants.filter((r) => r.regionId === "r1");
  const supplyChain = carolinas.map((r) => {
    const f = forecastSales(r.id, TOMORROW, { upliftPct: state.tomorrowUplift });
    const dep = forecastDepletion(r.id, f, r.id === rid ? { i1: potatoOnHand } : {});
    const avocado = dep.find((d) => d.itemId === "i2")!;
    return {
      restaurant: r,
      avocadoShortage: state.avocadoOrderIncreased ? 0 : avocado.shortage,
      belowPar: avocado.onHand < avocado.parLevel,
      shortSkus: dep.filter((d) => d.shortage > 0).length,
    };
  });

  /* ------------------------- Facility readiness -------------------------- */
  const rd = restaurant.readinessDetail;
  const facility = {
    score: Math.round((rd.kitchen + rd.dining + rd.restrooms + rd.exterior + rd.boh) / 5),
    detail: rd,
    tasks: [
      { label: "Hood & vent cleaning", due: "Overdue by 2 days", state: "overdue" as const },
      { label: "Mid-day restroom check", due: "Missed 11:00 AM slot", state: "overdue" as const },
      { label: "Walk-in temperature inspection", due: "Due today 4:00 PM", state: "due" as const },
      { label: "Quarterly deep clean", due: "Scheduled in 9 days", state: "ok" as const },
    ],
  };

  /* ---------------------------- Alert center ---------------------------- */
  const rawAlerts: OpAlert[] = [];
  if (potato.shortage > 0)
    rawAlerts.push({
      id: "al-inv",
      type: "Critical",
      title: `Russet Potatoes short ${potato.shortage} lbs tomorrow`,
      detail: `Depletion projected ${potato.depletionTime ?? "before close"} at forecast volume.`,
      priority: 98,
      impact: "Financial · guest",
    });
  if (staffing.gap > 0)
    rawAlerts.push({
      id: "al-staff",
      type: "Action Required",
      title: `${staffing.gap} role(s) short for tomorrow's peak block`,
      detail: `${staffing.scheduledStaff} scheduled against ${staffing.recommendedStaff} recommended.`,
      priority: 92,
      impact: "Guest · employee",
    });
  if (awaitingApproval > 0)
    rawAlerts.push({
      id: "al-guest",
      type: "Action Required",
      title: `${awaitingApproval} guest recovery draft(s) await approval`,
      detail: "Privé has drafted responses and recommended credits; no money moves without you.",
      priority: 85,
      impact: "Guest",
    });
  rawAlerts.push({
    id: "al-fore",
    type: "Predictive",
    title: `Tomorrow forecast ${tomorrow.vsTypicalPct > 0 ? "+" : ""}${tomorrow.vsTypicalPct}% vs typical`,
    detail: `${tomorrow.transactions.toLocaleString()} transactions at a $${tomorrow.avgTicket.toFixed(2)} average ticket.`,
    priority: 74,
    impact: "Financial",
  });
  if (expiringCerts > 0)
    rawAlerts.push({
      id: "al-cert",
      type: "Action Required",
      title: "ServSafe certification expires in 14 days",
      detail: "Andre Vega · line cook · renewal course assigned, reminder sequence running.",
      priority: 70,
      impact: "Compliance",
    });
  if (overdueTraining > 0)
    rawAlerts.push({
      id: "al-train",
      type: "Action Required",
      title: `${overdueTraining} employee(s) with incomplete training`,
      detail: "Allergen and closing modules outstanding ahead of the weekend.",
      priority: 66,
      impact: "Compliance · guest",
    });
  rawAlerts.push({
    id: "al-opp",
    type: "Opportunity",
    title: "Mimosa flight attaches on 21% of weekend brunch checks",
    detail: "A server prompt on tables of four could add an estimated $640 on Saturday.",
    priority: 40,
    impact: "Financial",
  });
  rawAlerts.push({
    id: "al-info",
    type: "Informational",
    title: "Summer brunch LTO launches Monday",
    detail: "Prep guide published; expect a 4–6% mix shift toward higher-cost proteins.",
    priority: 20,
    impact: "Awareness",
  });
  const alerts = rawAlerts
    .filter((a) => !state.dismissedAlerts.includes(a.id))
    .sort((a, b) => b.priority - a.priority);

  /* ---------------------------- Morning brief ---------------------------- */
  const brief = [
    `${DOWNAME(TOMORROW)} traffic is forecast ${tomorrow.vsTypicalPct > 0 ? "+" : ""}${tomorrow.vsTypicalPct}% above normal.`,
    potato.shortage > 0
      ? `Russet Potatoes are projected below minimum by ${potato.depletionTime ?? "close"} (${potato.shortage} lbs short).`
      : "Inventory now covers forecast demand across every tracked SKU.",
    staffing.gap > 0
      ? `${staffing.gap} scheduling gap(s) remain in the 4:00–8:00 PM block.`
      : "Coverage meets the recommended level for tomorrow's peak block.",
    overdueTraining > 0
      ? `${overdueTraining} employee(s) have incomplete training.`
      : "All assigned training is complete.",
    awaitingApproval > 0
      ? `${awaitingApproval} guest recovery draft(s) await your approval.`
      : "No guest recoveries are waiting on you.",
    expiringCerts > 0 ? "One certification expires within 14 days." : "No certifications expiring within 30 days.",
  ];

  const comms = announcements.map((a) => ({ ...a, acknowledged: state.acknowledged.includes(a.id) }));

  const pendingApprovals = [
    staffing.gap > 0 || state.shiftAccepted
      ? { id: "ap-staff", label: "Staffing adjustment — Saturday 4:00–8:00 PM", done: state.extraStaffApproved > 0 }
      : null,
    { id: "ap-guest", label: `Guest recovery drafts (${awaitingApproval})`, done: awaitingApproval === 0 },
    { id: "ap-order", label: "Supplier order increase — Russet Potatoes", done: state.potatoOrderIncrease > 0 },
    { id: "ap-sep", label: "Employee separation review — Jordan Smith", done: state.separationDecision !== null },
  ].filter(Boolean) as Array<{ id: string; label: string; done: boolean }>;

  return {
    restaurant,
    today,
    tomorrow,
    depletion,
    potato,
    atRisk,
    staffing,
    gmComplaints,
    openComplaints,
    awaitingApproval,
    complaintForecast,
    readiness,
    health,
    expiringCerts,
    overdueTraining,
    workforce,
    alerts,
    brief,
    comms,
    facility,
    supplyChain,
    scenario,
    pendingApprovals,
    separationCandidate: JORDAN_SEPARATION,
    enterprise: {
      revenueToday: enterpriseRevenue,
      monthRevenue,
      forecastRevenue: monthRevenue * 1.038,
      laborPct: round(laborPct, 1),
      foodCostPct,
      sameStoreSalesPct,
      marginDelta,
      sentiment,
      forecastVariance,
      recoverySpend,
      complaintRate: round(openEnterpriseComplaints / restaurants.length, 2),
      turnoverRiskStores: health.filter((h) => h.restaurant.turnoverDelta > 8).length,
      inventoryRiskStores: supplyChain.filter((s) => s.shortSkus > 0).length,
      atRiskStores: health.filter((h) => h.state !== "Healthy").length,
    },
  };
}

function DOWNAME(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
}

export type Derived = ReturnType<typeof derive>;

interface Ctx {
  state: State;
  derived: Derived;
  dispatch: React.Dispatch<Action>;
}

const PriveContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "prive-demo-state";

export function PriveProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  // Demo continuity: keep cross-persona state across reloads and hard navigation.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as Partial<State> });
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
  }, [state, hydrated]);
  const derived = useMemo(() => derive(state), [state]);
  const value = useMemo(() => ({ state, derived, dispatch }), [state, derived]);
  return <PriveContext.Provider value={value}>{children}</PriveContext.Provider>;
}

export function usePrive(): Ctx {
  const ctx = useContext(PriveContext);
  if (!ctx) throw new Error("usePrive must be used inside PriveProvider");
  return ctx;
}

export { CERT_EMPLOYEE, MAYA, JORDAN_SEPARATION };
