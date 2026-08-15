import { GM_RESTAURANT_ID, knowledge, restaurantById, TROUBLED_RESTAURANT_ID } from "./data";
import { money } from "./forecast";
import type { Derived, Persona } from "./store";

export interface PriveAnswer {
  answer: string;
  evidence?: string[];
  forecast?: string;
  recommendation?: string;
  confidence?: "High" | "Medium" | "Low";
  sources: string[];
  action?: string;
}

const has = (q: string, ...terms: string[]) => terms.some((t) => q.includes(t));

export function askPrive(question: string, persona: Persona, d: Derived): PriveAnswer {
  const q = question.toLowerCase();

  if (persona === "employee") {
    const hit = knowledge.find((k) => q.includes(k.q));
    if (hit) {
      return {
        answer: hit.a,
        confidence: "High",
        sources: [hit.source],
      };
    }
    if (has(q, "schedule", "shift", "working")) {
      return {
        answer: "Your next shift is today, 10:00 AM–4:00 PM at Ballantyne #02, section 3. There's also an open Saturday 4:00–8:00 PM shift you can express interest in from your Home screen.",
        confidence: "High",
        sources: ["7shifts (Scheduling)", "Privé Workforce"],
      };
    }
    return {
      answer: "I can help with your schedule, shift details, assigned training, policies and store procedures. Try asking about time off, allergens, closing procedure, or the fryer temperature SOP.",
      confidence: "High",
      sources: ["Privé Knowledge Base"],
    };
  }

  if (has(q, "handle tomorrow", "can we handle", "ready for tomorrow", "readiness")) {
    const r = d.readiness;
    return {
      answer:
        r.score >= 85
          ? `Yes — Ballantyne #02 is at ${r.score}% readiness for tomorrow at current inventory and staffing levels.`
          : `Not at current staffing and inventory levels. Ballantyne #02 is at ${r.score}% readiness for tomorrow.`,
      evidence: r.risks.map((x) => `${x.label}: ${x.probability}% probability — ${x.detail}`),
      forecast: `Forecast sales ${money(d.tomorrow.sales)} on ${d.tomorrow.transactions.toLocaleString()} transactions (${d.tomorrow.vsTypicalPct > 0 ? "+" : ""}${d.tomorrow.vsTypicalPct}% vs typical).`,
      recommendation:
        r.score >= 85
          ? "Hold current plan. Re-check inventory velocity at 2:00 PM."
          : `Increase potato inventory by ${Math.ceil(d.potato.shortage)} lbs, add ${d.staffing.gap} team member(s) 4–8 PM, resolve ${d.openComplaints} outstanding guest issue(s), and close the expiring certification.`,
      confidence: d.tomorrow.confidence,
      sources: ["Toast POS", "Restaurant365", "7shifts", "Privé Forecast Engine"],
      action: r.score >= 85 ? undefined : "Open readiness actions",
    };
  }

  if (has(q, "worry", "focus", "attention today", "most important")) {
    return {
      answer: `Five items need your attention at Ballantyne #02 today.`,
      evidence: [
        `Traffic tomorrow is forecast ${d.tomorrow.vsTypicalPct > 0 ? "+" : ""}${d.tomorrow.vsTypicalPct}% above normal.`,
        d.potato.depletionTime
          ? `Russet Potatoes projected to fall below minimum at ${d.potato.depletionTime} (${d.potato.shortage} lbs short).`
          : "Inventory is projected to cover forecast demand.",
        `${d.overdueTraining} employee(s) have incomplete training.`,
        `${d.openComplaints} guest complaint(s) await your approval.`,
        d.expiringCerts ? "One certification expires within 14 days." : "No certifications expiring.",
      ],
      recommendation: "Work the readiness checklist on your command center — it is ordered by financial and guest impact.",
      confidence: "High",
      sources: ["Toast POS", "Restaurant365", "Paycor", "Guest Feedback CRM"],
    };
  }

  if (has(q, "labor high", "why is labor", "labor yesterday", "overtime")) {
    const s = d.staffing;
    return {
      answer: `Labor is projected at ${s.projectedLaborPct}% against a ${s.targetLaborPct}% target — ${Math.round((s.projectedLaborPct - s.targetLaborPct) * 10) / 10} points above plan.`,
      evidence: [
        `${s.laborHoursNeeded} labor hours required against forecast peak volume.`,
        `Projected labor cost ${money(s.projectedLaborCost)} on ${money(d.tomorrow.sales)} forecast revenue.`,
        "14 overtime hours attributed to late clock-outs beyond scheduled shift end.",
      ],
      recommendation: "Review closing staffing and overtime assignment; shift two closers to a staggered out-time.",
      confidence: "High",
      sources: ["Paycor", "7shifts", "Toast POS"],
    };
  }

  if (has(q, "inventory", "potato", "shortage", "run out")) {
    return {
      answer: d.potato.shortage > 0
        ? `Russet Potatoes are projected to run short by ${d.potato.shortage} lbs tomorrow, depleting around ${d.potato.depletionTime ?? "close"}.`
        : `Russet Potatoes now cover forecast demand — ${d.potato.onHand} lbs on hand against ${d.potato.projectedUsage} lbs projected usage.`,
      evidence: [
        `Forecast transactions ${d.tomorrow.transactions.toLocaleString()} × 0.30 lbs per transaction = ${d.potato.projectedUsage} lbs required.`,
        `Current on-hand: ${d.potato.onHand} lbs. Par level: ${d.potato.parLevel} lbs.`,
        `${d.atRisk.length} SKU(s) currently flagged at risk across the location.`,
      ],
      recommendation: d.potato.shortage > 0
        ? `Increase tomorrow's Carolina Produce order by ${Math.ceil(d.potato.shortage)} lbs, or transfer from Charlotte #01 (11 miles).`
        : "No action required — monitor consumption velocity at 2:00 PM.",
      confidence: d.tomorrow.confidence,
      sources: ["Restaurant365", "Toast POS item mix", "Privé Forecast Engine"],
      action: d.potato.shortage > 0 ? "Increase order" : undefined,
    };
  }

  if (has(q, "which locations", "need attention", "deteriorat", "why is this restaurant")) {
    const t = restaurantById(TROUBLED_RESTAURANT_ID);
    const h = d.health.find((x) => x.restaurant.id === TROUBLED_RESTAURANT_ID)!;
    const counts = d.health.reduce<Record<string, number>>((a, x) => ({ ...a, [x.state]: (a[x.state] ?? 0) + 1 }), {});
    return {
      answer: `${counts["Healthy"] ?? 0} healthy, ${counts["Watch"] ?? 0} on watch, ${(counts["Action Required"] ?? 0) + (counts["Critical"] ?? 0)} requiring action. ${t.name} is the clearest outlier at a health score of ${h.score}.`,
      evidence: [
        `Turnover +${t.turnoverDelta}% versus region.`,
        `Complaints +${t.complaintDelta}%.`,
        `Labor +${t.laborDelta} points.`,
        `Training completion ${t.trainingDelta}%.`,
      ],
      forecast: "Sales trend has declined for six consecutive weeks and is forecast to continue absent intervention.",
      recommendation: "Deterioration correlates with staffing instability beginning roughly six weeks ago. Assign a GM performance review and a retention plan before the summer LTO launch.",
      confidence: "Medium",
      sources: ["Toast POS", "Paycor", "Guest Feedback CRM", "Privé Health Model"],
      action: "Assign GM review",
    };
  }

  if (has(q, "margin", "ebitda", "profit", "losing")) {
    const e = d.enterprise;
    return {
      answer: `Margin is forecast 1.2 points below target this month while revenue runs ahead of plan at ${money(e.monthRevenue)}.`,
      evidence: [
        `Enterprise labor at ${e.laborPct}% against a 25.6% target.`,
        "Protein cost increases of 6.2% announced by Southern Meats.",
        `${e.turnoverRiskStores} locations carrying elevated turnover.`,
        `Service-recovery spend of ${money(e.recoverySpend)} issued this period.`,
      ],
      forecast: "Holding current labor models, margin variance widens a further 0.4 points next month.",
      recommendation: "Adjust weekend labor models in the three highest-variance locations, renegotiate protein commitments, and fund retention actions where turnover exceeds 8%.",
      confidence: "Medium",
      sources: ["Toast POS", "Paycor", "Restaurant365", "Privé Forecast Engine"],
    };
  }

  if (has(q, "what if", "increase", "10%", "scenario", "traffic")) {
    return {
      answer: "Use the What-If panel — I recalculate revenue, transactions, staffing requirement, labor percentage and inventory exposure from the same historical series, not from a stored answer.",
      recommendation: "Set the traffic slider and compare readiness before and after.",
      confidence: "High",
      sources: ["Privé Scenario Engine"],
      action: "Open scenario engine",
    };
  }

  if (has(q, "complaint", "guest", "recovery", "refund")) {
    return {
      answer: `${d.openComplaints} guest issue(s) are unresolved at Ballantyne #02 and ${d.gmComplaints.filter((c) => c.status === "Awaiting Approval").length} are drafted and awaiting your approval.`,
      evidence: d.gmComplaints.slice(0, 3).map((c) => `${c.customer} · ${c.type} · ${c.severity} severity · ${c.status}`),
      forecast: `Tomorrow's volume implies ${d.complaintForecast.expected} expected new complaints at ${d.complaintForecast.ratePer1000} per 1,000 transactions.`,
      recommendation: "Approve or edit the drafted recoveries — unresolved issues raise tomorrow's service-time risk.",
      confidence: d.complaintForecast.confidence,
      sources: ["Guest Feedback CRM", "Voice AI", "Toast POS"],
      action: "Open complaint center",
    };
  }

  if (has(q, "staffing", "schedule", "coverage", "shift")) {
    const s = d.staffing;
    return {
      answer: s.gap > 0
        ? `You are ${s.gap} team member(s) short of the recommended coverage for tomorrow's peak block.`
        : "Coverage now meets the recommended level for tomorrow's peak block.",
      evidence: [
        `Forecast transactions ${s.projectedTransactions.toLocaleString()}.`,
        `Recommended ${s.recommendedStaff} · scheduled ${s.scheduledStaff}.`,
        `Projected labor ${s.projectedLaborPct}% against ${s.targetLaborPct}% target.`,
      ],
      recommendation: s.gap > 0 ? "Broadcast the open shift to qualified team members and approve the responses." : "No action required.",
      confidence: "High",
      sources: ["7shifts", "Paycor", "Privé Forecast Engine"],
      action: s.gap > 0 ? "Open staffing" : undefined,
    };
  }

  return {
    answer:
      "I can answer questions across sales, forecasting, labor, inventory, guests, workforce and compliance for the locations you're authorized to see. Try: \"What should I worry about today?\", \"Why is labor high?\", \"Can we handle tomorrow?\" or \"Where are we losing margin?\"",
    confidence: "High",
    sources: ["Privé Cognitive Layer"],
  };
}

export const SUGGESTIONS: Record<Persona, string[]> = {
  employee: ["What should I do if a guest asks about gluten?", "How do I request a day off?", "How do I close the restaurant?", "When is my next shift?"],
  gm: ["What should I worry about today?", "Can we handle tomorrow?", "Why is labor high?", "What's at risk in inventory?"],
  regional: ["Which locations need attention?", "Why is this restaurant deteriorating?", "Where is staffing risk highest?"],
  guest: ["What are your hours?", "Part of my order was missing", "Do you take reservations?"],
  executive: ["Where are we losing margin?", "What happens if weekend traffic increases 10%?", "Which locations need attention?", "What should we do?"],
};
