import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import {
  CERT_EMPLOYEE,
  GM_RESTAURANT_ID,
  MAYA,
  TODAY,
  TOMORROW,
  complaints as seedComplaints,
  employeesFor,
  inventoryItems,
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
  issuedBy: string;
  issuedAt: string;
  expires: string;
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
  complaints: Complaint[];
  giftCredits: GiftCredit[];
  audit: AuditEvent[];
  scenarioUplift: number; // executive what-if, in %
  tomorrowUplift: number; // baseline predicted traffic uplift for tomorrow
  shiftOfferSent: boolean;
  separationDecision: string | null;
}

type Action =
  | { type: "persona"; persona: Persona }
  | { type: "regionalRestaurant"; id: string }
  | { type: "sendShiftOffer" }
  | { type: "acceptShift" }
  | { type: "approveStaffing" }
  | { type: "increasePotatoOrder"; lbs: number }
  | { type: "completeCertification" }
  | { type: "completeTraining" }
  | { type: "resolveComplaint"; id: string; amount: number }
  | { type: "createComplaint"; complaint: Complaint }
  | { type: "scenario"; uplift: number }
  | { type: "separation"; decision: string }
  | { type: "audit"; event: Omit<AuditEvent, "id" | "at"> };

const now = () =>
  new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

let auditSeq = 100;
const logEvent = (e: Omit<AuditEvent, "id" | "at">): AuditEvent => ({
  ...e,
  id: `au${++auditSeq}`,
  at: now(),
});

function code(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
    if (i % 4 === 3 && i < 11) out += "-";
  }
  return `MT-${out}`;
}

const initialState: State = {
  persona: "gm",
  regionalRestaurantId: "s4",
  shiftAccepted: false,
  extraStaffApproved: 0,
  potatoOrderIncrease: 0,
  certificationCompleted: false,
  mayaTrainingComplete: false,
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
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "persona":
      return { ...state, persona: action.persona };
    case "regionalRestaurant":
      return { ...state, regionalRestaurantId: action.id };
    case "sendShiftOffer":
      return {
        ...state,
        shiftOfferSent: true,
        audit: [
          logEvent({
            actor: "Jordan Ellis (GM)",
            agent: "Scheduling Agent",
            action: "Broadcast open-shift opportunity",
            detail: "Saturday 4:00–8:00 PM · qualified servers · Ballantyne #02",
            approval: "Manager approved",
          }),
          ...state.audit,
        ],
      };
    case "acceptShift":
      if (state.shiftAccepted) return state;
      return {
        ...state,
        shiftAccepted: true,
        audit: [
          logEvent({
            actor: "Maya Robinson (Employee)",
            agent: "Scheduling Agent",
            action: "Shift interest submitted",
            detail: "Saturday 4:00–8:00 PM · routed to GM for approval",
            approval: "Pending",
          }),
          ...state.audit,
        ],
      };
    case "approveStaffing":
      return {
        ...state,
        extraStaffApproved: Math.min(2, state.extraStaffApproved + (state.shiftAccepted ? 2 : 1)),
        audit: [
          logEvent({
            actor: "Jordan Ellis (GM)",
            agent: "Scheduling Agent",
            action: "Approved staffing adjustment",
            detail: "Added coverage for Saturday 4:00–8:00 PM peak block",
            approval: "Manager approved",
          }),
          ...state.audit,
        ],
      };
    case "increasePotatoOrder":
      return {
        ...state,
        potatoOrderIncrease: state.potatoOrderIncrease + action.lbs,
        audit: [
          logEvent({
            actor: "Jordan Ellis (GM)",
            agent: "Inventory Agent",
            action: "Increased supplier order",
            detail: `Russet Potatoes +${action.lbs} lbs · Carolina Produce Co. · next-day delivery`,
            approval: "Manager approved",
          }),
          ...state.audit,
        ],
      };
    case "completeCertification":
      return {
        ...state,
        certificationCompleted: true,
        audit: [
          logEvent({
            actor: "Andre Vega (Employee)",
            agent: "Compliance Agent",
            action: "Certification renewed",
            detail: "ServSafe food handler · expiry extended 24 months",
            approval: "Automatic (low risk)",
          }),
          ...state.audit,
        ],
      };
    case "completeTraining":
      return {
        ...state,
        mayaTrainingComplete: true,
        audit: [
          logEvent({
            actor: "Maya Robinson (Employee)",
            agent: "Training Agent",
            action: "Completed assigned training",
            detail: "Allergen Awareness (5 min) · onboarding step cleared",
            approval: "Automatic (low risk)",
          }),
          ...state.audit,
        ],
      };
    case "resolveComplaint": {
      const c = state.complaints.find((x) => x.id === action.id);
      if (!c) return state;
      const credit: GiftCredit = {
        code: code(),
        amount: action.amount,
        complaintId: c.id,
        issuedBy: "Jordan Ellis (GM)",
        issuedAt: new Date().toISOString().slice(0, 10),
        expires: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
        redeemed: false,
      };
      return {
        ...state,
        complaints: state.complaints.map((x) => (x.id === action.id ? { ...x, status: "Resolved" } : x)),
        giftCredits: [credit, ...state.giftCredits],
        audit: [
          logEvent({
            actor: "Jordan Ellis (GM)",
            agent: "Guest Recovery Agent",
            action: `Approved guest recovery — $${action.amount}`,
            detail: `${c.customer} · ${c.type} · credit ${credit.code} issued and response sent`,
            approval: "Manager approved",
          }),
          ...state.audit,
        ],
      };
    }
    case "createComplaint":
      return {
        ...state,
        complaints: [action.complaint, ...state.complaints],
        audit: [
          logEvent({
            actor: "Guest (Voice)",
            agent: "Voice AI Agent",
            action: "Complaint intake created",
            detail: `${action.complaint.customer} · ${action.complaint.type} · routed to GM, Ballantyne #02`,
            approval: "Automatic (low risk)",
          }),
          ...state.audit,
        ],
      };
    case "scenario":
      return { ...state, scenarioUplift: action.uplift };
    case "separation":
      return {
        ...state,
        separationDecision: action.decision,
        audit: [
          logEvent({
            actor: "Jordan Ellis (GM)",
            agent: "Workforce Agent",
            action: `Separation review decision — ${action.decision}`,
            detail: "Jordan Smith · 45 days without a scheduled shift · human decision required",
            approval: "Manager approved",
          }),
          ...state.audit,
        ],
      };
    case "audit":
      return { ...state, audit: [logEvent(action.event), ...state.audit] };
    default:
      return state;
  }
}

/* ------------------------- Derived intelligence ------------------------- */

export function derive(state: State) {
  const rid = GM_RESTAURANT_ID;
  const today = forecastSales(rid, TODAY);
  const tomorrow = forecastSales(rid, TOMORROW, { upliftPct: state.tomorrowUplift });

  const potatoOnHand = (inventoryItems[0]!.onHand ?? 82) + state.potatoOrderIncrease;
  const depletion = forecastDepletion(rid, tomorrow, { i1: potatoOnHand });
  const potato = depletion.find((d) => d.itemId === "i1")!;
  const atRisk = depletion.filter((d) => d.risk === "Critical" || d.risk === "At Risk");

  const baseStaffing = forecastStaffing(rid, tomorrow);
  const staffing = forecastStaffing(rid, tomorrow, baseStaffing.scheduledStaff + state.extraStaffApproved);

  const gmComplaints = state.complaints.filter((c) => c.restaurantId === rid);
  const openComplaints = gmComplaints.filter((c) => c.status !== "Resolved").length;
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
    const oc = state.complaints.filter((c) => c.restaurantId === r.id && c.status !== "Resolved").length;
    const gap = r.id === rid ? staffing.gap : 0;
    return { restaurant: r, ...restaurantHealth(r, oc, gap) };
  });

  // Enterprise roll-up
  const enterpriseToday = restaurants.map((r) => forecastSales(r.id, TODAY));
  const enterpriseRevenue = enterpriseToday.reduce((a, f) => a + f.sales, 0);
  const monthRevenue = enterpriseRevenue * 30;
  const recoverySpend = state.giftCredits.reduce((a, g) => a + g.amount, 0);
  const laborPct =
    restaurants.reduce((a, r) => {
      const f = forecastSales(r.id, TODAY);
      return a + forecastStaffing(r.id, f).projectedLaborPct;
    }, 0) / restaurants.length;

  return {
    today,
    tomorrow,
    depletion,
    potato,
    atRisk,
    staffing,
    gmComplaints,
    openComplaints,
    complaintForecast,
    readiness,
    health,
    expiringCerts,
    overdueTraining,
    enterprise: {
      revenueToday: enterpriseRevenue,
      monthRevenue,
      laborPct: Math.round(laborPct * 10) / 10,
      recoverySpend,
      turnoverRiskStores: health.filter((h) => h.restaurant.turnoverDelta > 8).length,
      inventoryRiskStores: 3,
      atRiskStores: health.filter((h) => h.state !== "Healthy").length,
    },
  };
}

export type Derived = ReturnType<typeof derive>;

interface Ctx {
  state: State;
  derived: Derived;
  dispatch: React.Dispatch<Action>;
}

const PriveContext = createContext<Ctx | null>(null);

export function PriveProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const derived = useMemo(() => derive(state), [state]);
  const value = useMemo(() => ({ state, derived, dispatch }), [state, derived]);
  return <PriveContext.Provider value={value}>{children}</PriveContext.Provider>;
}

export function usePrive(): Ctx {
  const ctx = useContext(PriveContext);
  if (!ctx) throw new Error("usePrive must be used inside PriveProvider");
  return ctx;
}

export { CERT_EMPLOYEE, MAYA };
