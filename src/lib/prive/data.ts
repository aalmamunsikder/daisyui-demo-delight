import { mulberry32, pick, range, round } from "./rng";

/* ------------------------------------------------------------------ *
 * The Morning Table Restaurant Group — synthetic operating data.
 * Deterministic (seeded) so SSR and client render identical results.
 * ------------------------------------------------------------------ */

export type HealthState = "Healthy" | "Watch" | "Action Required" | "Critical";

export interface Region {
  id: string;
  name: string;
}

export interface Restaurant {
  id: string;
  name: string;
  city: string;
  regionId: string;
  ownership: "Corporate" | "Franchise";
  volume: "High" | "Average" | "Low";
  openHour: number;
  closeHour: number;
  baseSales: number;
  avgTicket: number;
  targetLaborPct: number;
  transactionsPerLaborHour: number;
  minStaff: number;
  turnoverDelta: number;
  complaintDelta: number;
  laborDelta: number;
  trainingDelta: number;
  readinessDetail: { kitchen: number; dining: number; restrooms: number; exterior: number; boh: number };
}

export interface SalesDay {
  date: string;
  restaurantId: string;
  sales: number;
  transactions: number;
  laborCost: number;
}

export interface Employee {
  id: string;
  name: string;
  restaurantId: string;
  role: string;
  status: "Active" | "Onboarding" | "Leave" | "Inactive";
  startDate: string;
  tenureMonths: number;
  scheduledHours: number;
  workedHours: number;
  wage: number;
  attendanceExceptions: number;
  trainingOverdue: boolean;
  certExpiresInDays: number | null;
  daysSinceLastShift: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  mixPct: number; // share of transactions containing this item
}

export interface Recipe {
  menuItemId: string;
  skuId: string;
  qtyPerUnit: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  parLevel: number;
  onHand: number;
  supplier: string;
  leadTimeDays: number;
  usagePerTransaction: number;
}

export interface Complaint {
  id: string;
  customer: string;
  restaurantId: string;
  date: string;
  channel: "Voice" | "Email" | "Web Form" | "App" | "Survey" | "Review Site";
  type: string;
  summary: string;
  sentiment: "Negative" | "Very Negative" | "Neutral";
  severity: "Low" | "Medium" | "High";
  status: "Open" | "Awaiting Approval" | "Resolved" | "Escalated" | "Rejected";
  orderRef: string;
  recommendedCredit: number;
  draftResponse: string;
}

export interface Integration {
  id: string;
  name: string;
  category: string;
  status: "Connected" | "Simulated" | "Available";
  lastSync: string;
}

export interface Announcement {
  id: string;
  title: string;
  from: string;
  date: string;
  summary: string;
  affectsLocation: boolean;
}

export const BRAND = "The Morning Table Restaurant Group";

export const regions: Region[] = [
  { id: "r1", name: "Carolinas" },
  { id: "r2", name: "Gulf Coast" },
  { id: "r3", name: "Mid-Atlantic" },
];

const restaurantSeed: Array<[string, string, string, Restaurant["ownership"], Restaurant["volume"]]> = [
  ["Charlotte #01", "Charlotte, NC", "r1", "Corporate", "High"],
  ["Ballantyne #02", "Charlotte, NC", "r1", "Corporate", "High"],
  ["Raleigh #03", "Raleigh, NC", "r1", "Franchise", "Average"],
  ["Charlotte #04", "Charlotte, NC", "r1", "Franchise", "Average"],
  ["Greenville #05", "Greenville, SC", "r1", "Corporate", "Average"],
  ["Mobile #06", "Mobile, AL", "r2", "Franchise", "Average"],
  ["Baton Rouge #07", "Baton Rouge, LA", "r2", "Corporate", "High"],
  ["Pensacola #08", "Pensacola, FL", "r2", "Franchise", "Low"],
  ["Tampa #09", "Tampa, FL", "r2", "Corporate", "High"],
  ["Richmond #10", "Richmond, VA", "r3", "Corporate", "Average"],
  ["Arlington #11", "Arlington, VA", "r3", "Franchise", "High"],
  ["Bethesda #12", "Bethesda, MD", "r3", "Corporate", "Average"],
];

export const restaurants: Restaurant[] = restaurantSeed.map(([name, city, regionId, ownership, volume], i) => {
  const rand = mulberry32(1000 + i);
  const troubled = name === "Charlotte #04";
  const base = volume === "High" ? 21500 : volume === "Average" ? 15200 : 10400;
  return {
    id: `s${i + 1}`,
    name,
    city,
    regionId,
    ownership,
    volume,
    openHour: 7,
    closeHour: 21,
    baseSales: round(base * (0.92 + rand() * 0.16)),
    avgTicket: round(23 + rand() * 6, 2),
    targetLaborPct: 25.6,
    transactionsPerLaborHour: round(6.2 + rand() * 1.4, 2),
    minStaff: volume === "High" ? 12 : 9,
    turnoverDelta: troubled ? 23 : round(rand() * 14 - 6),
    complaintDelta: troubled ? 31 : round(rand() * 18 - 9),
    laborDelta: troubled ? 8 : round(rand() * 6 - 3),
    trainingDelta: troubled ? -17 : round(rand() * 12 - 4),
    readinessDetail: {
      kitchen: troubled ? 74 : 88 + Math.floor(rand() * 10),
      dining: troubled ? 79 : 90 + Math.floor(rand() * 8),
      restrooms: troubled ? 71 : 89 + Math.floor(rand() * 9),
      exterior: troubled ? 80 : 87 + Math.floor(rand() * 11),
      boh: troubled ? 68 : 88 + Math.floor(rand() * 9),
    },
  };
});

export const GM_RESTAURANT_ID = "s2"; // Ballantyne #02
export const TROUBLED_RESTAURANT_ID = "s4"; // Charlotte #04

export function restaurantById(id: string): Restaurant {
  return restaurants.find((r) => r.id === id) ?? restaurants[0]!;
}
export function regionName(id: string): string {
  return regions.find((r) => r.id === id)?.name ?? "—";
}

/* ----------------------------- Calendar ----------------------------- */
// Demo "today" is a fixed Friday so the storyline is stable.
export const TODAY = new Date(Date.UTC(2026, 4, 15)); // Friday, May 15 2026
export const TOMORROW = new Date(TODAY.getTime() + 86400000);

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

// Weekday multipliers (0=Sun) — brunch concept peaks on weekends.
const WEEKDAY_INDEX = [1.42, 0.72, 0.76, 0.82, 0.9, 1.05, 1.33];

/* --------------------------- Sales history -------------------------- */
export const salesHistory: SalesDay[] = [];
for (const r of restaurants) {
  const rand = mulberry32(parseInt(r.id.slice(1)) * 7919);
  for (let back = 90; back >= 1; back--) {
    const d = new Date(TODAY.getTime() - back * 86400000);
    const dow = d.getUTCDay();
    const trend = r.id === TROUBLED_RESTAURANT_ID ? 1 - (90 - back) * 0.0011 : 1 + (90 - back) * 0.0004;
    const noise = 0.93 + rand() * 0.14;
    const sales = round(r.baseSales * WEEKDAY_INDEX[dow]! * trend * noise);
    const transactions = Math.round(sales / r.avgTicket);
    const laborPct = (r.targetLaborPct + (r.id === TROUBLED_RESTAURANT_ID ? 3.4 : 0) + (rand() * 3 - 1.5)) / 100;
    salesHistory.push({ date: iso(d), restaurantId: r.id, sales, transactions, laborCost: round(sales * laborPct) });
  }
}

export function historyFor(restaurantId: string): SalesDay[] {
  return salesHistory.filter((s) => s.restaurantId === restaurantId);
}

/* ------------------------------ People ------------------------------ */
const FIRST = ["Maya", "Jordan", "Andre", "Priya", "Luis", "Chloe", "Devin", "Sofia", "Marcus", "Elena", "Trey", "Nina", "Omar", "Kayla", "Ben", "Ivy", "Ray", "Talia", "Cody", "Zara"];
const LAST = ["Robinson", "Smith", "Vega", "Patel", "Ortega", "Bennett", "Clark", "Marino", "Ellis", "Novak", "Hughes", "Barrett", "Haddad", "Monroe", "Fischer", "Lang", "Ortiz", "Reyes", "Doyle", "Kim"];
const ROLES = ["Server", "Server", "Server", "Line Cook", "Line Cook", "Prep Cook", "Host", "Busser", "Dishwasher", "Shift Lead", "Assistant Manager"];

export const employees: Employee[] = [];
{
  const rand = mulberry32(424242);
  let n = 0;
  for (const r of restaurants) {
    const count = r.volume === "High" ? 48 : r.volume === "Average" ? 41 : 33;
    for (let i = 0; i < count; i++) {
      n++;
      const troubled = r.id === TROUBLED_RESTAURANT_ID;
      const tenure = Math.max(1, Math.round((troubled ? 6 : 18) * rand() + rand() * 12));
      const status: Employee["status"] =
        rand() < 0.05 ? "Onboarding" : rand() < 0.03 ? "Leave" : rand() < 0.02 ? "Inactive" : "Active";
      employees.push({
        id: `e${n}`,
        name: `${pick(rand, FIRST)} ${pick(rand, LAST)}`,
        restaurantId: r.id,
        role: pick(rand, ROLES),
        status,
        startDate: iso(new Date(TODAY.getTime() - tenure * 30 * 86400000)),
        tenureMonths: tenure,
        scheduledHours: 20 + Math.round(rand() * 18),
        workedHours: 18 + Math.round(rand() * 20),
        wage: round(14 + rand() * 8, 2),
        attendanceExceptions: rand() < (troubled ? 0.34 : 0.14) ? 1 + Math.floor(rand() * 3) : 0,
        trainingOverdue: rand() < (troubled ? 0.3 : 0.11),
        certExpiresInDays: rand() < 0.08 ? 3 + Math.floor(rand() * 40) : null,
        daysSinceLastShift: status === "Inactive" ? 45 + Math.floor(rand() * 20) : Math.floor(rand() * 4),
      });
    }
  }
}

// Storyline anchors at the GM restaurant.
export const MAYA: Employee = {
  id: "e-maya",
  name: "Maya Robinson",
  restaurantId: GM_RESTAURANT_ID,
  role: "Server",
  status: "Onboarding",
  startDate: iso(new Date(TODAY.getTime() - 3 * 86400000)),
  tenureMonths: 0,
  scheduledHours: 24,
  workedHours: 12,
  wage: 15.5,
  attendanceExceptions: 0,
  trainingOverdue: true,
  certExpiresInDays: null,
  daysSinceLastShift: 1,
};
export const JORDAN_SEPARATION: Employee = {
  id: "e-jordan",
  name: "Jordan Smith",
  restaurantId: GM_RESTAURANT_ID,
  role: "Busser",
  status: "Inactive",
  startDate: iso(new Date(TODAY.getTime() - 400 * 86400000)),
  tenureMonths: 13,
  scheduledHours: 0,
  workedHours: 0,
  wage: 14,
  attendanceExceptions: 4,
  trainingOverdue: false,
  certExpiresInDays: null,
  daysSinceLastShift: 45,
};
export const CERT_EMPLOYEE: Employee = {
  id: "e-cert",
  name: "Andre Vega",
  restaurantId: GM_RESTAURANT_ID,
  role: "Line Cook",
  status: "Active",
  startDate: iso(new Date(TODAY.getTime() - 900 * 86400000)),
  tenureMonths: 29,
  scheduledHours: 38,
  workedHours: 40,
  wage: 20.25,
  attendanceExceptions: 0,
  trainingOverdue: false,
  certExpiresInDays: 14,
  daysSinceLastShift: 0,
};
employees.unshift(MAYA, JORDAN_SEPARATION, CERT_EMPLOYEE);

export const ONBOARDING_STEPS = [
  { label: "Offer accepted", done: true },
  { label: "Background verification", done: true },
  { label: "I-9 verification", done: false },
  { label: "Payroll setup", done: true },
  { label: "Food safety training", done: false },
  { label: "Policy acknowledgement", done: true },
  { label: "Uniform & equipment", done: true },
  { label: "First shift scheduled", done: true },
];

export function employeesFor(restaurantId: string): Employee[] {
  return employees.filter((e) => e.restaurantId === restaurantId);
}

/* ---------------------------- Menu & stock --------------------------- */
const MENU_SEED: Array<[string, number, number]> = [
  ["Broken Yolk Benedict", 16.5, 0.14], ["Lemon Ricotta Pancakes", 14.25, 0.11], ["Shrimp & Grits", 18.75, 0.08],
  ["Farmhouse Skillet", 15.5, 0.1], ["Avocado Toast", 12.95, 0.09], ["Morning Table Burger", 16.95, 0.12],
  ["Chicken & Waffles", 17.5, 0.09], ["Steak & Eggs", 22.5, 0.05], ["Veggie Omelette", 13.75, 0.07],
  ["Biscuits & Gravy", 12.5, 0.08], ["Crab Cake Benedict", 21.0, 0.04], ["Brioche French Toast", 14.0, 0.07],
  ["Southern Fried Chicken Sandwich", 15.75, 0.06], ["Cobb Salad", 15.25, 0.05], ["Smoked Salmon Plate", 19.5, 0.03],
  ["Breakfast Burrito", 13.5, 0.06], ["Loaded Hash Browns", 9.5, 0.09], ["Buttermilk Biscuit", 4.5, 0.12],
  ["Fresh Fruit Bowl", 7.5, 0.06], ["Side Bacon", 5.5, 0.15], ["Cold Brew", 5.0, 0.22],
  ["Fresh Squeezed OJ", 6.0, 0.13], ["Mimosa Flight", 16.0, 0.07], ["Bloody Mary", 12.0, 0.06],
  ["Kids Pancake Plate", 8.5, 0.05],
];
export const menuItems: MenuItem[] = MENU_SEED.map(([name, price, mixPct], i) => ({
  id: `m${i + 1}`, name, price, mixPct,
}));

const SKU_SEED: Array<[string, string, number, number, string, number, number]> = [
  ["Russet Potatoes", "lbs", 140, 82, "Carolina Produce Co.", 1, 0.3],
  ["Hass Avocados", "each", 220, 96, "Gulf Fresh Distribution", 2, 0.22],
  ["Cage-Free Eggs", "dozen", 180, 152, "Piedmont Farms", 1, 0.19],
  ["Applewood Bacon", "lbs", 120, 104, "Southern Meats", 2, 0.14],
  ["Buttermilk", "gal", 40, 33, "Piedmont Farms", 1, 0.05],
  ["AP Flour", "lbs", 200, 178, "Carolina Produce Co.", 3, 0.09],
  ["Gulf Shrimp", "lbs", 60, 41, "Gulf Fresh Distribution", 3, 0.05],
  ["Stone-Ground Grits", "lbs", 90, 77, "Southern Meats", 3, 0.06],
  ["Chicken Breast", "lbs", 130, 111, "Southern Meats", 2, 0.12],
  ["Ribeye Steak", "lbs", 55, 47, "Southern Meats", 3, 0.03],
  ["Brioche Loaf", "each", 70, 58, "Queen City Bakery", 1, 0.08],
  ["Cold Brew Concentrate", "gal", 30, 19, "Blue Ridge Coffee", 2, 0.07],
  ["Valencia Oranges", "lbs", 110, 88, "Carolina Produce Co.", 2, 0.11],
  ["Blue Crab Meat", "lbs", 25, 17, "Gulf Fresh Distribution", 4, 0.02],
  ["Smoked Salmon", "lbs", 30, 24, "Gulf Fresh Distribution", 4, 0.02],
];
export const inventoryItems: InventoryItem[] = SKU_SEED.map(([name, unit, par, onHand, supplier, lead, usage], i) => ({
  id: `i${i + 1}`, name, unit, parLevel: par, onHand, supplier, leadTimeDays: lead, usagePerTransaction: usage,
}));
// Round out the SKU catalog to 50+ for the inventory module counts.
for (const [i, n] of range(40).entries()) {
  const rand = mulberry32(9000 + n);
  inventoryItems.push({
    id: `i${16 + i}`,
    name: `Pantry SKU ${String(i + 1).padStart(2, "0")}`,
    unit: "cs",
    parLevel: 30 + Math.floor(rand() * 40),
    onHand: 20 + Math.floor(rand() * 50),
    supplier: pick(rand, ["Carolina Produce Co.", "Southern Meats", "Gulf Fresh Distribution", "Queen City Bakery"]),
    leadTimeDays: 1 + Math.floor(rand() * 3),
    usagePerTransaction: round(0.01 + rand() * 0.04, 3),
  });
}

export const recipes: Recipe[] = [
  { menuItemId: "m6", skuId: "i1", qtyPerUnit: 0.3 },
  { menuItemId: "m17", skuId: "i1", qtyPerUnit: 0.25 },
  { menuItemId: "m5", skuId: "i2", qtyPerUnit: 0.75 },
  { menuItemId: "m1", skuId: "i3", qtyPerUnit: 0.17 },
];

/* ---------------------------- Complaints ---------------------------- */
const COMPLAINT_SEED: Array<[string, string, Complaint["channel"], string, string, number, Complaint["severity"]]> = [
  ["Dana Whitfield", GM_RESTAURANT_ID, "Voice", "Missing item", "Order took 35 minutes and one entrée was missing.", 20, "High"],
  ["Peter Alvarez", GM_RESTAURANT_ID, "Email", "Service time", "Waited 22 minutes for coffee refills on a Saturday.", 15, "Medium"],
  ["Renée Osei", GM_RESTAURANT_ID, "Web Form", "Food quality", "Benedict arrived cold; hollandaise separated.", 18, "Medium"],
  ["Cal Jennings", TROUBLED_RESTAURANT_ID, "Review Site", "Cleanliness", "Restroom was not stocked and floor was wet.", 10, "High"],
  ["Alma Ruiz", TROUBLED_RESTAURANT_ID, "App", "Order accuracy", "Mobile order missed both sides.", 15, "Medium"],
  ["Grant Mueller", "s9", "Survey", "Service", "Host stand unattended for 10 minutes.", 10, "Low"],
];
export const complaints: Complaint[] = COMPLAINT_SEED.map(([customer, restaurantId, channel, type, summary, credit, severity], i) => ({
  id: `c${i + 1}`,
  customer,
  restaurantId,
  date: iso(new Date(TODAY.getTime() - (i % 3) * 86400000)),
  channel,
  type,
  summary,
  sentiment: severity === "High" ? "Very Negative" : "Negative",
  severity,
  status: i < 3 ? "Awaiting Approval" : i < 5 ? "Open" : "Resolved",
  orderRef: `ORD-${48210 + i * 137}`,
  recommendedCredit: credit,
  draftResponse:
    `Hi ${customer.split(" ")[0]}, thank you for telling us what happened — that isn't the standard we hold ourselves to. ` +
    `I've shared this directly with the kitchen and service leads on duty. I'd like to make it right with a $AMOUNT dining credit ` +
    `and personally welcome you back on your next visit.\n\n— General Manager, The Morning Table`,
}));

/* --------------------------- Integrations --------------------------- */
export const integrations: Integration[] = [
  { id: "n1", name: "Toast POS", category: "POS", status: "Connected", lastSync: "2 min ago" },
  { id: "n2", name: "PAR Brink", category: "POS", status: "Simulated", lastSync: "18 min ago" },
  { id: "n3", name: "Square", category: "POS", status: "Available", lastSync: "—" },
  { id: "n4", name: "Oracle Simphony", category: "POS", status: "Available", lastSync: "—" },
  { id: "n5", name: "Paycor", category: "Payroll / HR", status: "Connected", lastSync: "1 hr ago" },
  { id: "n6", name: "ADP", category: "Payroll / HR", status: "Simulated", lastSync: "3 hr ago" },
  { id: "n7", name: "Workday", category: "Payroll / HR", status: "Available", lastSync: "—" },
  { id: "n8", name: "TalentReef", category: "Recruiting", status: "Connected", lastSync: "25 min ago" },
  { id: "n9", name: "Workstream", category: "Recruiting", status: "Available", lastSync: "—" },
  { id: "n10", name: "7shifts", category: "Scheduling", status: "Connected", lastSync: "6 min ago" },
  { id: "n11", name: "HotSchedules", category: "Scheduling", status: "Simulated", lastSync: "40 min ago" },
  { id: "n12", name: "Restaurant365", category: "Inventory", status: "Connected", lastSync: "12 min ago" },
  { id: "n13", name: "MarketMan", category: "Inventory", status: "Available", lastSync: "—" },
  { id: "n14", name: "Guest Feedback CRM", category: "Customer", status: "Connected", lastSync: "9 min ago" },
  { id: "n15", name: "Website Ordering", category: "Ordering", status: "Connected", lastSync: "4 min ago" },
  { id: "n16", name: "Third-Party Delivery", category: "Ordering", status: "Simulated", lastSync: "15 min ago" },
  { id: "n17", name: "Email / SMS Gateway", category: "Communication", status: "Connected", lastSync: "1 min ago" },
  { id: "n18", name: "Microsoft Teams", category: "Communication", status: "Simulated", lastSync: "30 min ago" },
];

/* -------------------------- Communications -------------------------- */
export const announcements: Announcement[] = [
  { id: "a1", title: "Summer brunch LTO launches Monday", from: "Corporate Marketing", date: iso(TODAY), summary: "Three new plates and a mimosa flight promo. Kitchen prep guide attached; expect a 4–6% mix shift toward higher-cost proteins.", affectsLocation: true },
  { id: "a2", title: "Protein cost increase — supplier notice", from: "Supply Chain", date: iso(new Date(TODAY.getTime() - 86400000)), summary: "Southern Meats raising ribeye and chicken breast pricing 6.2% effective next cycle. Review menu mix and waste tightly.", affectsLocation: true },
  { id: "a3", title: "Updated allergen handling policy v4.1", from: "Compliance", date: iso(new Date(TODAY.getTime() - 2 * 86400000)), summary: "Gluten cross-contact procedure revised. All FOH staff must acknowledge within 7 days.", affectsLocation: true },
  { id: "a4", title: "POS firmware update window", from: "IT Operations", date: iso(new Date(TODAY.getTime() - 4 * 86400000)), summary: "Toast terminals update overnight Tuesday. No action required.", affectsLocation: false },
];

/* --------------------------- Knowledge base -------------------------- */
export const knowledge: Array<{ q: string; a: string; source: string }> = [
  {
    q: "gluten",
    a: "Confirm the guest's sensitivity level first. For celiac guests, use the dedicated gluten-safe prep board, fresh gloves, and a clean pan — never the shared griddle. Flag the ticket as ALLERGEN so the kitchen plates it separately, and tell the guest that our kitchen is not a certified gluten-free facility.",
    source: "Allergen Handling Policy v4.1 · Compliance",
  },
  {
    q: "close",
    a: "Closing runs in four passes: (1) stop-service and break down FOH stations, (2) walk-in and line temperature log, (3) deep-clean hood filters and floor drains, (4) drawer count with a manager witness and safe drop. Photo-verify the restroom and dumpster area in the closing checklist before you clock out.",
    source: "Closing Procedure SOP · Operations",
  },
  {
    q: "time off",
    a: "Submit time-off from My Schedule → Request Time Off at least 14 days ahead. Requests route to your GM and sync to 7shifts. You'll get a decision notification within 48 hours; anything under 14 days needs a shift-swap partner attached.",
    source: "Team Handbook §6 · People Operations",
  },
  {
    q: "fryer",
    a: "If fryer temperature drifts more than 15°F from 350°F, pull the basket, check the oil level, and reset the high-limit switch once. If it drifts again, tag the unit out of service and log a facilities ticket — do not continue frying allergen or breaded items in an unstable fryer.",
    source: "Kitchen Equipment SOP · Facilities",
  },
];
