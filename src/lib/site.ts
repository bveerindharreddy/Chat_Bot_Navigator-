export const SITE = {
  name: "TechThrust",
  legal: "TechThrust Digital Solutions FZC",
  tagline: "Build Smarter. Engage Better.",
  email: "info@tech-thrust.com",
  whatsappDisplay: "+971 58 520 3369",
  whatsappUrl: "https://wa.me/971585203369",
  location: "United Arab Emirates",
  description:
    "Intelligent AI products, automation, and technology solutions that help businesses transform customer interactions and streamline operations.",
};

/** Exact options required for the demo form. Keep order and spelling. */
export const PRODUCT_OPTIONS = [
  "Velynora",
  "Velynora Lite",
  "VOCALIS",
  "AI Automation",
  "AI Product Requirement",
  "Startup-as-a-Service",
  "General Enquiry",
] as const;
export type ProductOption = (typeof PRODUCT_OPTIONS)[number];

export type ProductSlug = "velynora" | "velynora-lite" | "vocalis";

export const PRODUCTS: {
  slug: ProductSlug;
  name: string;
  option: ProductOption;
  positioning: string;
  problem: string;
  capabilities: string;
  to: "/products/velynora" | "/products/velynora-lite" | "/products/vocalis";
  demoLabel: string;
}[] = [
  {
    slug: "velynora",
    name: "Velynora",
    option: "Velynora",
    positioning: "Unified Conversational AI Platform",
    problem: "Customer conversations across sales, support and booking that teams can't always answer in time.",
    capabilities:
      "Build, launch and manage voice and chat agents for sales, outbound campaigns, support, reception, feedback and custom workflows.",
    to: "/products/velynora",
    demoLabel: "Book a Velynora Demo",
  },
  {
    slug: "velynora-lite",
    name: "Velynora Lite",
    option: "Velynora Lite",
    positioning: "Automated Voice Calls & Follow-up Messaging",
    problem: "Routine reminders, announcements and follow-ups that are delayed or missed when handled manually.",
    capabilities:
      "Scheduled one-way voice calls with configured WhatsApp or email follow-ups — self-service or managed by TechThrust.",
    to: "/products/velynora-lite",
    demoLabel: "Book a Velynora Lite Demo",
  },
  {
    slug: "vocalis",
    name: "Vocalis",
    option: "VOCALIS",
    positioning: "AI-Powered Website Interaction Platform",
    problem: "Visitors who can't quickly find the right information or the next step on a website.",
    capabilities:
      "Voice and text interaction, guided navigation, discovery, recommendations, booking and human handoff — right on your website.",
    to: "/products/vocalis",
    demoLabel: "Book a Vocalis Demo",
  },
];

export const INDUSTRIES = [
  { name: "E-commerce & Retail", icon: "ShoppingBag", text: "Product discovery, personalized recommendations, shopping assistance, and customer enquiries." },
  { name: "Healthcare & Clinics", icon: "Stethoscope", text: "Appointment enquiries, service information, patient communication, and routine reminders." },
  { name: "Real Estate", icon: "Building2", text: "Property discovery, listing enquiries, lead qualification, and viewing appointments." },
  { name: "Hospitality & Travel", icon: "Plane", text: "Guest enquiries, service discovery, booking assistance, and timely travel communications." },
  { name: "Education & EdTech", icon: "GraduationCap", text: "Course discovery, admissions enquiries, program recommendations, and student follow-ups." },
  { name: "Consulting & Professional Services", icon: "Briefcase", text: "Service discovery, prospective-client qualification, consultation booking, and follow-up." },
  { name: "Coaching & Training", icon: "Users", text: "Program discovery, enrollment enquiries, session scheduling, and participant communication." },
  { name: "B2B & Enterprise", icon: "Network", text: "Solution discovery, interactive presentations, lead qualification, and sales meeting scheduling." },
] as const;

export const SERVICES = [
  {
    id: "ai-automation",
    name: "AI Automation",
    short: "Turn repetitive processes into intelligent workflows using AI agents, automation and system integrations.",
    option: "AI Automation" as ProductOption,
  },
  {
    id: "ai-strategy",
    name: "AI Strategy, Consulting & Engineering",
    short: "Identify the right AI opportunities and engineer production-ready solutions — from assessment to adoption.",
    option: "AI Product Requirement" as ProductOption,
  },
  {
    id: "digital-growth",
    name: "Digital Growth Engine",
    short: "Connect acquisition with intelligent engagement, lead qualification and timely follow-up.",
    option: "General Enquiry" as ProductOption,
  },
  {
    id: "startup-as-a-service",
    name: "Startup-as-a-Service",
    short: "A structured journey from strategy and product planning to MVP, go-to-market readiness and evolution.",
    option: "Startup-as-a-Service" as ProductOption,
  },
];

export const DIFFERENTIATORS = [
  { n: "01", title: "AI-First Thinking", text: "We start with business challenges and identify where AI can create meaningful value—not with technology for technology's sake." },
  { n: "02", title: "Products Built for Business", text: "Purpose-driven AI products—Velynora, Velynora Lite, and Vocalis—designed to address practical customer engagement and communication needs." },
  { n: "03", title: "Solutions Beyond Software", text: "Combine AI products, intelligent automation, integrations, and implementation services to address broader business requirements." },
  { n: "04", title: "Focused on Business Outcomes", text: "Prioritize practical improvements in customer engagement, operational efficiency, and business growth—with clear objectives rather than unsupported promises." },
];

export const FRAMEWORK = [
  { title: "Understand", text: "Learn about business goals, customer needs, processes, and pain points." },
  { title: "Identify", text: "Determine where AI products, automation, or tailored technology could create value." },
  { title: "Deliver", text: "Configure, implement, and integrate the agreed solution." },
  { title: "Evolve", text: "Review performance and identify improvements as requirements change." },
];
