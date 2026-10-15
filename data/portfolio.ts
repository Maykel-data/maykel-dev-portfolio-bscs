/**
 * SINGLE SOURCE OF TRUTH for all portfolio content.
 *
 * Every fact below is taken from Michael's CVs (Aug 24 & Aug 25, 2026).
 * Anything not documented in the CVs is marked with TODO and rendered
 * as an honest "details coming soon" state — never invented.
 */

export type EducationMilestone = {
  id: string;
  period: string;
  school: string;
  detail: string;
};

export type ExperienceEntry = {
  id: string;
  role: string;
  org: string;
  period: string;
  detail: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer: string;
  date: string;
  image?: string;
  href?: string;
};

export type Project = {
  id: string;
  title: string;
  /** Short factual role/type line shown as the sheet meta. */
  meta: string;
  /** One-line summary used in the sheet tooltip / screen readers. */
  summary: string;
  /** Canonical art preset for the folder sheet. */
  art: "aurora" | "ember" | "dusk" | "glacier" | "verdant";
  /** Real live URL only — leave null until a real one exists. */
  href: string | null;
  /** true once details are provided by Michael; false = TODO placeholder. */
  verified: boolean;
};

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ??
  (process.env.NODE_ENV === "production" ? "/maykel-dev-portfolio-bscs" : "");

export const profile = {
  name: "Michael Jhosh T. Abundabar",
  firstName: "Michael Jhosh",
  role: "Computer Science undergraduate",
  school: "Quezon City University",
  location: "Quezon City, Philippines",
  email: "mjabundabar@gmail.com",
  linkedin: "https://www.linkedin.com/in/michael-jhosh-t-abundabar-2b7209347",
  /** Local copy of the Aug 25, 2026 CV. */
  resumeUrl: `${basePath}/documents/michael-abundabar-cv.pdf`,
  /** Hero one-liner. */
  intro:
    "I build and test web applications with Python and SQL — and I enjoy tracing the bugs that keep them from working.",
  /** Longer about copy for the scroll section. */
  about:
    "Fourth-year Computer Science student at Quezon City University, focused on backend development and quality assurance. I have tested kiosk and web platforms, reviewed API endpoints and database workflows, and co-founded a student computing chapter where I design algorithmic competition problems. I am currently looking for an internship where I can keep building reliable software.",
  availability: "IT Intern @NCMB-DOLE · AI & Full-Stack Dev",
} as const;

/* ------------------------------------------------------------------ */
/* Education — chronological, used by the horizontal timeline.         */
/* ------------------------------------------------------------------ */

export const education: EducationMilestone[] = [
  {
    id: "jfbshs",
    period: "2017 — 2021",
    school: "Judge Feliciano Belmonte Sr. High School",
    detail: "Junior high graduate.",
  },
  {
    id: "olfu",
    period: "2021 — 2023",
    school: "Our Lady of Fatima University",
    detail: "Senior High School, Science, Technology, Engineering and Mathematics.",
  },
  {
    id: "qcu",
    period: "2023 — Present",
    school: "Quezon City University",
    detail: "BS Computer Science, currently in fourth year.",
  },
];

export const educationPeriodLabel = "2017 — Present";

/* ------------------------------------------------------------------ */
/* Experience & leadership                                             */
/* ------------------------------------------------------------------ */

export const experience: ExperienceEntry[] = [
  {
    id: "jpcs",
    role: "Founding Member & Board of Programmer",
    org: "Junior Philippine Computer Society — Quezon City University Chapter",
    period: "Aug 2024 — Jul 2026",
    detail:
      "Co-founded the university chapter and designed algorithmic competition questions, evaluating participant code for logic and efficiency.",
  },
  {
    id: "dswd",
    role: "Farm Support Worker, Cash for Work Program",
    org: "Department of Social Welfare and Development",
    period: "Apr 2026 — Jul 2026",
    detail:
      "Assisted with agricultural operations, data recording, and logistics in Quezon City.",
  },
];

/* ------------------------------------------------------------------ */
/* Certifications & award                                              */
/* ------------------------------------------------------------------ */

export const certifications: Certification[] = [
  {
    id: "ibm-python",
    name: "Python for Data Science, AI & Development",
    issuer: "IBM (Coursera)",
    date: "Nov 2025",
    image: `${basePath}/images/certificates/cert-python.jpg`,
    href: "https://coursera.org/verify/BCQUCLRAVOXL",
  },
  {
    id: "opswat-icip",
    name: "Introduction to Critical Infrastructure Protection",
    issuer: "OPSWAT",
    date: "Jan 2025",
    image: `${basePath}/images/certificates/cert-opswat.jpg`,
    href: "https://learn.opswatacademy.com/certificate/_znPZAU4nA",
  },
  {
    id: "sql-udemy",
    name: "Learn SQL in 3 Hours: A Tutorial for Fast Learners",
    issuer: "Udemy (OCSALY Academy)",
    date: "Dec 2024",
    image: `${basePath}/images/certificates/cert-sql.jpg`,
    href: "https://ude.my/UC-0f5026d1-4150-4212-b919-dce4a74d2855",
  },
];

export const award = {
  title:
    "An Experimental Investigation of Shredded and Pulverized Polyethylene: Factors to Improve the Quality of Concrete Mixture Used by Construction Workers and Engineers",
  result: "3rd place, Senior High research fair",
  year: "2023",
} as const;

/* ------------------------------------------------------------------ */
/* Skills — verbatim groups from the CVs                               */
/* ------------------------------------------------------------------ */

export const skills = {
  languages: ["Python", "SQL", "AI-assisted development"],
  tools: [
    "Git",
    "VS Code",
    "Render",
    "TestSprite",
    "Vercel",
    "Firebase",
    "Microsoft Excel",
    "Word",
  ],
} as const;

/* ------------------------------------------------------------------ */
/* Projects                                                            */
/*                                                                     */
/* The first two are documented in the CVs.                            */
/* The rest are Michael's own project names — details still TODO.      */
/* Do not add descriptions, stacks, or URLs until verified.            */
/* ------------------------------------------------------------------ */

export const projects: Project[] = [
  {
    id: "barangay-portal",
    title: "Barangay San Martin De Porres Portal",
    meta: "Web development — case study",
    summary:
      "Official digital portal for local governance: community announcements, emergency hotlines, online clearance and permit requests, and a transparent service guide.",
    art: "aurora",
    href: null,
    verified: true,
  },
  {
    id: "intelearnhub",
    title: "IntelearnHub DTR & Payroll System",
    meta: "Quality assurance — debugging",
    summary:
      "Tested application functionality, traced routing and authentication issues in the kiosk interface, and reviewed API endpoints and database workflows for daily time record synchronization.",
    art: "dusk",
    href: null,
    verified: true,
  },
  {
    // TODO(Michael): add summary, tech stack, status, and a real URL.
    id: "cmd-inventory",
    title: "CMD Inventory System",
    meta: "Details coming soon",
    summary: "",
    art: "ember",
    href: null,
    verified: false,
  },
  {
    // TODO(Michael): add summary, tech stack, status, and a real URL.
    id: "tikas-rider",
    title: "Tikas-Rider",
    meta: "Details coming soon",
    summary: "",
    art: "verdant",
    href: null,
    verified: false,
  },
  {
    // TODO(Michael): add summary, tech stack, status, and a real URL.
    id: "nutritrack",
    title: "NutriTrack Barangay PWA",
    meta: "Details coming soon",
    summary: "",
    art: "glacier",
    href: null,
    verified: false,
  },
  {
    // TODO(Michael): add summary, tech stack, status, and a real URL.
    id: "sigaw-link",
    title: "SIGAW-LINK",
    meta: "Details coming soon",
    summary: "",
    art: "ember",
    href: null,
    verified: false,
  },
];

/** Gallery grouping shown in the glass folders. */
export const projectFolders = [
  {
    id: "featured",
    label: "Featured Projects",
    art: "aurora" as const,
    projects: projects.filter((p) => p.verified),
  },
  {
    id: "in-progress",
    label: "More Projects",
    art: "dusk" as const,
    projects: projects.filter((p) => !p.verified),
  },
];
