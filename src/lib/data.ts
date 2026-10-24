// ---------------------------------------------------------------------------
// Tyche — shared types, business constants and demo data.
// Everything here is front-end only; swap for API calls when the backend lands.
// ---------------------------------------------------------------------------

/** Tyche keeps 20% of every consultation and booking fee. */
export const TYCHE_FEE = 0.2;

/** Community (paid WhatsApp circle) */
export const COMMUNITY_CAP = 10_000;
export const COMMUNITY_MEMBERS = 7_482; // demo number — wire to real count
export const COMMUNITY_PRICE = 5_000; // ₦ per year — placeholder, change to your real price

export type Channel = "call" | "chat" | "meet";
export type SessionKind = "consultation" | "booking";

export const CHANNEL_LABEL: Record<Channel, string> = {
  call: "Voice call in Tyche",
  chat: "Private chat in Tyche",
  meet: "Google Meet in Tyche",
};

export const KIND_COPY: Record<SessionKind, { title: string; short: string; blurb: string }> = {
  consultation: {
    title: "Consultation",
    short: "A first conversation",
    blurb:
      "A short, private chat to understand your options. Talk it through, ask anything, no pressure to go further.",
  },
  booking: {
    title: "Booking",
    short: "Hire them for your case",
    blurb:
      "Engage the lawyer to actually work on your matter — drafting, filing, representing you, following it through.",
  },
};

export const PRACTICE_AREAS = [
  "Sexual harassment",
  "Workplace harassment",
  "Online & cyber harassment",
  "Gender-based violence",
  "Domestic violence",
  "Employment law",
  "Criminal litigation",
  "Human rights",
  "Family law",
  "Campus & school cases",
];

export const STATES = [
  "Lagos", "FCT Abuja", "Rivers", "Oyo", "Ogun", "Kano", "Kaduna", "Enugu", "Anambra", "Edo",
  "Delta", "Akwa Ibom", "Cross River", "Plateau", "Kwara", "Osun", "Ondo", "Ekiti", "Imo", "Abia",
  "Benue", "Nasarawa", "Niger", "Kogi", "Bauchi", "Borno", "Adamawa", "Gombe", "Taraba", "Yobe",
  "Sokoto", "Kebbi", "Zamfara", "Katsina", "Jigawa", "Bayelsa", "Ebonyi",
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type Lawyer = {
  id: string;
  name: string;
  title: string;
  state: string;
  city: string;
  yearCalled: number;
  areas: string[];
  languages: string[];
  bio: string;
  rating: number;
  reviews: number;
  consultFee: number;
  consultFree: boolean;
  bookingFee: number;
  bookingFree: boolean;
  sessionMins: number;
  days: string[];
  from: string;
  to: string;
  channels: Channel[];
  verified: boolean;
  responds: string;
  hue: number; // avatar colour
  // live-only extras
  slug?: string;
  status?: "pending" | "approved" | "rejected";
  meetLink?: string;
  payoutReady?: boolean;
  payoutBank?: string;
  payoutAccountName?: string;
  payoutLast4?: string;
  hasLicence?: boolean;
  userId?: string;
};

export type EvidenceKind = "image" | "audio" | "video" | "doc";
export type Evidence = {
  id: string;
  name: string;
  kind: EvidenceKind;
  size: number;
  preview?: string; // small images only (data URL)
  note?: string;
  path?: string; // storage path (live)
};

export type Report = {
  id: string;
  createdAt: string;
  alias: string;
  category: string;
  setting: string;
  when: string;
  state: string;
  relation: string;
  description: string;
  wants: string[];
  evidence: Evidence[];
  shareWithLawyers: boolean;
  hideName: boolean;
  authorities: string[];
  mine?: boolean;
  hidden?: boolean;
};

export type Bid = {
  id: string;
  reportId: string;
  lawyerId: string;
  fee: number;
  free: boolean;
  kind: SessionKind;
  message: string;
  createdAt: string;
  status: "pending" | "accepted" | "declined";
};

export type Booking = {
  id: string;
  lawyerId: string;
  clientName: string;
  kind: SessionKind;
  date: string;
  time: string;
  channel: Channel;
  fee: number;
  status: "pending_payment" | "upcoming" | "done" | "cancelled";
  reportId?: string;
  createdAt: string;
  clientId?: string;
  meetLink?: string;
};

export type Message = { id: string; threadId: string; from: "client" | "lawyer"; text: string; at: string };

export const HARASSMENT_TYPES = [
  "Unwanted touching or groping",
  "Sexual comments, jokes or gestures",
  "Requests for sex in exchange for something (jobs, grades, favours)",
  "Stalking or following",
  "Online harassment, threats or sextortion",
  "Sharing my intimate images without consent",
  "Sexual assault",
  "Something else",
];

export const SETTINGS = ["Work", "School / campus", "Online", "Public place / transport", "Home", "Religious setting", "Somewhere else"];

export const AUTHORITIES = [
  { id: "police", name: "Nigeria Police — Gender / Family Support Desk", note: "Formal police report at a station near you" },
  { id: "dsva", name: "Lagos State DSVA", note: "Domestic & Sexual Violence Agency (Lagos only)" },
  { id: "employer", name: "My employer / HR", note: "For workplace cases" },
  { id: "school", name: "My school's management", note: "For campus cases" },
];

const lawyer = (l: Partial<Lawyer> & Pick<Lawyer, "id" | "name">): Lawyer => ({
  title: "Barrister & Solicitor",
  state: "Lagos",
  city: "Ikeja",
  yearCalled: 2015,
  areas: ["Sexual harassment"],
  languages: ["English"],
  bio: "",
  rating: 4.9,
  reviews: 40,
  consultFee: 15000,
  consultFree: false,
  bookingFee: 150000,
  bookingFree: false,
  sessionMins: 30,
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  from: "09:00",
  to: "17:00",
  channels: ["call", "chat", "meet"],
  verified: true,
  responds: "within 2 hours",
  hue: 280,
  ...l,
});

export const LAWYERS: Lawyer[] = [
  lawyer({
    id: "adaeze-okafor",
    name: "Adaeze Okafor",
    city: "Lekki",
    yearCalled: 2012,
    areas: ["Sexual harassment", "Workplace harassment", "Employment law"],
    languages: ["English", "Igbo"],
    bio: "I've spent over a decade helping women hold employers and colleagues accountable. I'll explain everything in plain words, and I won't rush you.",
    rating: 4.9,
    reviews: 128,
    consultFee: 0,
    consultFree: true,
    bookingFee: 250000,
    hue: 285,
  }),
  lawyer({
    id: "fatima-bello",
    name: "Fatima Bello",
    state: "FCT Abuja",
    city: "Wuse II",
    yearCalled: 2016,
    areas: ["Gender-based violence", "Human rights", "Criminal litigation"],
    languages: ["English", "Hausa"],
    bio: "Human rights lawyer with courtroom experience on sexual offence cases. Calm, thorough, and fiercely on your side.",
    rating: 5.0,
    reviews: 74,
    consultFee: 10000,
    bookingFee: 180000,
    days: ["Mon", "Wed", "Fri", "Sat"],
    hue: 20,
  }),
  lawyer({
    id: "temi-adeyemi",
    name: "Temi Adeyemi",
    city: "Yaba",
    yearCalled: 2018,
    areas: ["Online & cyber harassment", "Sexual harassment", "Campus & school cases"],
    languages: ["English", "Yoruba"],
    bio: "Screenshots, DMs, leaked pictures — I handle the online stuff. Cybercrimes Act cases are my everyday work.",
    rating: 4.8,
    reviews: 96,
    consultFee: 8000,
    bookingFee: 120000,
    from: "10:00",
    to: "20:00",
    hue: 185,
  }),
  lawyer({
    id: "ngozi-eze",
    name: "Ngozi Eze",
    state: "Enugu",
    city: "Independence Layout",
    yearCalled: 2010,
    areas: ["Domestic violence", "Family law", "Gender-based violence"],
    languages: ["English", "Igbo", "Pidgin"],
    bio: "Fifteen years in family and protection-order matters. I'll help you feel safe first, then we'll talk strategy.",
    rating: 4.9,
    reviews: 152,
    consultFee: 12000,
    bookingFee: 0,
    bookingFree: true,
    channels: ["call", "chat"],
    hue: 330,
  }),
  lawyer({
    id: "kemi-balogun",
    name: "Kemi Balogun",
    city: "Victoria Island",
    yearCalled: 2014,
    areas: ["Workplace harassment", "Employment law"],
    languages: ["English", "Yoruba"],
    bio: "Former in-house counsel. I know exactly how HR departments think, and how to make them listen.",
    rating: 4.7,
    reviews: 61,
    consultFee: 20000,
    bookingFee: 300000,
    sessionMins: 45,
    hue: 40,
  }),
  lawyer({
    id: "amina-yusuf",
    name: "Amina Yusuf",
    state: "Kano",
    city: "Nassarawa GRA",
    yearCalled: 2019,
    areas: ["Sexual harassment", "Campus & school cases", "Human rights"],
    languages: ["English", "Hausa", "Arabic"],
    bio: "Young, sharp and patient. I started practice to help girls on campus who had nobody to call.",
    rating: 4.9,
    reviews: 38,
    consultFee: 0,
    consultFree: true,
    bookingFee: 90000,
    hue: 160,
  }),
  lawyer({
    id: "ifeoma-nwosu",
    name: "Ifeoma Nwosu",
    state: "Rivers",
    city: "Port Harcourt",
    yearCalled: 2013,
    areas: ["Criminal litigation", "Sexual harassment", "Gender-based violence"],
    languages: ["English", "Igbo", "Pidgin"],
    bio: "Litigator. If your matter needs to go to court, I'll take it all the way and keep you informed at every step.",
    rating: 4.8,
    reviews: 83,
    consultFee: 15000,
    bookingFee: 220000,
    hue: 260,
  }),
  lawyer({
    id: "tolu-ajayi",
    name: "Toluwani Ajayi",
    state: "Oyo",
    city: "Ibadan",
    yearCalled: 2017,
    areas: ["Online & cyber harassment", "Human rights", "Domestic violence"],
    languages: ["English", "Yoruba"],
    bio: "Gentle with people, tough on paperwork. Weekend and evening slots for women who can't get away during the day.",
    rating: 4.9,
    reviews: 57,
    consultFee: 5000,
    bookingFee: 100000,
    days: ["Thu", "Fri", "Sat", "Sun"],
    from: "16:00",
    to: "21:00",
    hue: 15,
  }),
];

/** Anonymised cases from other users so the lawyer case board is populated in the demo. */
export const SEED_REPORTS: Report[] = [
  {
    id: "TY-48213",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    alias: "Sunflower",
    category: "Requests for sex in exchange for something (jobs, grades, favours)",
    setting: "Work",
    when: "Over the last 3 months",
    state: "Lagos",
    relation: "My line manager",
    description:
      "My manager keeps making it clear that my confirmation depends on me 'being nice' to him. He sends messages late at night. I have screenshots and one voice note.",
    wants: ["Understand my options", "Report formally"],
    evidence: [
      { id: "e1", name: "whatsapp-screens.zip", kind: "doc", size: 2_400_000 },
      { id: "e2", name: "voice-note-0412.m4a", kind: "audio", size: 820_000 },
    ],
    shareWithLawyers: true,
    hideName: true,
    authorities: [],
  },
  {
    id: "TY-48177",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    alias: "Hibiscus",
    category: "Sharing my intimate images without consent",
    setting: "Online",
    when: "Last week",
    state: "FCT Abuja",
    relation: "An ex-partner",
    description:
      "My ex posted private pictures on a fake Instagram page and is threatening to send more to my family unless I pay.",
    wants: ["Get it taken down", "Report to the police"],
    evidence: [
      { id: "e3", name: "fake-page-screenshot.png", kind: "image", size: 640_000 },
      { id: "e4", name: "threat-messages.pdf", kind: "doc", size: 310_000 },
    ],
    shareWithLawyers: true,
    hideName: true,
    authorities: ["police"],
  },
  {
    id: "TY-48102",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    alias: "Marigold",
    category: "Unwanted touching or groping",
    setting: "School / campus",
    when: "Two weeks ago",
    state: "Oyo",
    relation: "A lecturer",
    description:
      "A lecturer touched me in his office when I went to ask about my result. Two classmates say the same happened to them.",
    wants: ["Understand my options", "Report to the school"],
    evidence: [{ id: "e5", name: "statement-draft.docx", kind: "doc", size: 120_000 }],
    shareWithLawyers: true,
    hideName: true,
    authorities: ["school"],
  },
  {
    id: "TY-48055",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
    alias: "Lily",
    category: "Stalking or following",
    setting: "Public place / transport",
    when: "Ongoing",
    state: "Rivers",
    relation: "Someone I don't know well",
    description:
      "A man from my estate follows me to the bus stop most mornings and has started showing up at my workplace.",
    wants: ["Feel safe", "Get a restraining order"],
    evidence: [
      { id: "e6", name: "video-bus-stop.mp4", kind: "video", size: 9_800_000 },
      { id: "e7", name: "photo-car.jpg", kind: "image", size: 1_100_000 },
    ],
    shareWithLawyers: true,
    hideName: true,
    authorities: [],
  },
];

export const naira = (n: number) => "₦" + Math.round(n).toLocaleString("en-NG");
export const lawyerTake = (fee: number) => fee * (1 - TYCHE_FEE);
export const tycheTake = (fee: number) => fee * TYCHE_FEE;
export const uid = (p = "") => p + Math.random().toString(36).slice(2, 8).toUpperCase();
export const firstName = (n: string) => n.trim().split(/\s+/)[0] || n;
export const initials = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

export const fileKind = (f: File): EvidenceKind =>
  f.type.startsWith("image/") ? "image" : f.type.startsWith("audio/") ? "audio" : f.type.startsWith("video/") ? "video" : "doc";

export const prettySize = (b: number) =>
  b > 1_000_000 ? (b / 1_000_000).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1000)) + " KB";

export const timeAgo = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

/** Next N dates (YYYY-MM-DD) that fall on the lawyer's working days. */
export function nextDates(days: string[], n = 10) {
  const out: { iso: string; label: string; day: string }[] = [];
  const d = new Date();
  for (let i = 1; out.length < n && i < 60; i++) {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
    const day = DAYS[(x.getDay() + 6) % 7];
    if (days.includes(day))
      out.push({
        iso: `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`,
        label: x.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        day,
      });
  }
  return out;
}

export function timeSlots(from: string, to: string, mins: number) {
  const toMin = (s: string) => +s.slice(0, 2) * 60 + +s.slice(3, 5);
  const out: string[] = [];
  for (let t = toMin(from); t + mins <= toMin(to); t += Math.max(mins, 30)) {
    const h = Math.floor(t / 60), m = t % 60;
    const ampm = h >= 12 ? "pm" : "am";
    out.push(`${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${ampm}`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Admin demo data — sample accounts, pending lawyer applications and payments
// so the admin dashboard has something to show before the backend exists.
// ---------------------------------------------------------------------------

export type Account = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "client" | "lawyer" | "admin";
  lawyerId?: string;
  state: string;
  joinedAt: string;
  suspended?: boolean;
};

export type CommunityMember = {
  name: string;
  phone: string;
  city: string;
  joinedAt: string;
  ref: string;
  status?: "pending" | "active" | "expired";
  expiresAt?: string;
};

export type SupportMessage = { id: string; userId: string; fromAdmin: boolean; text: string; at: string; readAt?: string };

/** Tyche support contacts */
export const SUPPORT_WHATSAPP = "2348057564242"; // 0805 756 4242
export const SUPPORT_WHATSAPP_DISPLAY = "0805 756 4242";
export const INSTAGRAM_HANDLE = "tyche.io";

export type Payment = {
  reference: string;
  purpose: "booking" | "community";
  amount: number;
  tycheShare: number;
  lawyerShare: number;
  status: "pending" | "success" | "failed";
  bookingId?: string;
  createdAt: string;
};

/** Shown instead of a tiny real number while the circle is young. */
export const communityLine = (count: number) =>
  count >= 100 ? `${count.toLocaleString()} women in the circle` : "Be one of the first in the circle";

const daysAgo = (d: number, h = 0) => new Date(Date.now() - (d * 24 + h) * 3600_000).toISOString();

const CLIENT_NAMES = [
  "Tomi A.", "Chiamaka O.", "Zainab M.", "Blessing E.", "Funke L.", "Hauwa B.", "Ifeoma K.", "Kemi S.",
  "Precious U.", "Aisha D.", "Ngozi P.", "Ruth T.", "Simisola F.", "Esther I.", "Halima G.", "Joy N.",
  "Amaka C.", "Bisola R.", "Fatima Y.", "Deborah W.",
];

export const SEED_ACCOUNTS: Account[] = [
  ...CLIENT_NAMES.map((n, i) => ({
    id: "U-" + (1000 + i),
    name: n,
    email: n.toLowerCase().replace(/[^a-z]/g, "") + "@mail.com",
    role: "client" as const,
    state: ["Lagos", "FCT Abuja", "Rivers", "Oyo", "Kano", "Enugu"][i % 6],
    joinedAt: daysAgo((i * 7) % 29, i),
  })),
  ...LAWYERS.map((l, i) => ({
    id: "U-L" + i,
    name: l.name,
    email: l.id + "@chambers.ng",
    role: "lawyer" as const,
    lawyerId: l.id,
    state: l.state,
    joinedAt: daysAgo(30 + i * 3),
  })),
];

/** Lawyer applications waiting for admin review. */
export const SEED_APPLICANTS: Lawyer[] = [
  {
    ...LAWYERS[2],
    id: "chidinma-obi", name: "Chidinma Obi", city: "Surulere", yearCalled: 2021, verified: false, rating: 5, reviews: 0,
    areas: ["Workplace harassment", "Employment law"], bio: "Employment lawyer passionate about safe workplaces for women.",
    consultFee: 7000, bookingFee: 80000, hue: 300, responds: "within a day",
  },
  {
    ...LAWYERS[1],
    id: "musa-ibrahim", name: "Musa Ibrahim", state: "Kaduna", city: "Barnawa", yearCalled: 2015, verified: false, rating: 5, reviews: 0,
    areas: ["Criminal litigation", "Human rights"], bio: "Criminal litigator with experience prosecuting sexual offence cases.",
    consultFee: 10000, bookingFee: 200000, hue: 210, responds: "within a day",
  },
  {
    ...LAWYERS[3],
    id: "grace-etim", name: "Grace Etim", state: "Akwa Ibom", city: "Uyo", yearCalled: 2019, verified: false, rating: 5, reviews: 0,
    areas: ["Domestic violence", "Family law"], bio: "Family lawyer offering pro bono help to women in Akwa Ibom.",
    consultFee: 0, consultFree: true, bookingFee: 0, bookingFree: true, hue: 350, responds: "within a day",
  },
];

SEED_ACCOUNTS.push(
  ...SEED_APPLICANTS.map((l, i) => ({
    id: "U-A" + i,
    name: l.name,
    email: l.id + "@chambers.ng",
    role: "lawyer" as const,
    lawyerId: l.id,
    state: l.state,
    joinedAt: daysAgo(i, 3 + i),
  })),
);

export const SEED_BOOKINGS: Booking[] = [
  ["adaeze-okafor", "Tomi A.", "booking", 250000, 2], ["fatima-bello", "Zainab M.", "consultation", 10000, 3],
  ["temi-adeyemi", "Blessing E.", "booking", 120000, 5], ["kemi-balogun", "Kemi S.", "consultation", 20000, 6],
  ["ifeoma-nwosu", "Precious U.", "booking", 220000, 9], ["tolu-ajayi", "Simisola F.", "consultation", 5000, 11],
  ["temi-adeyemi", "Joy N.", "consultation", 8000, 14], ["adaeze-okafor", "Amaka C.", "consultation", 0, 16],
  ["fatima-bello", "Hauwa B.", "booking", 180000, 20], ["ngozi-eze", "Ruth T.", "consultation", 12000, 24],
].map(([lawyerId, clientName, kind, fee, d], i) => ({
  id: "BK-S" + i,
  lawyerId: lawyerId as string,
  clientName: clientName as string,
  kind: kind as SessionKind,
  fee: fee as number,
  date: daysAgo(d as number).slice(0, 10),
  time: "11:00am",
  channel: (["call", "meet", "chat"] as Channel[])[i % 3],
  status: (d as number) > 4 ? "done" : "upcoming",
  createdAt: daysAgo((d as number) + 1),
}));
