// Slide copy follows the TechThrust site (home, /products/*, /services, /about). Market figures are third-party estimates with sources printed on the slide.
import { INDUSTRIES } from "@/lib/site";

export type ChartPoint = { label: string; value: number };
export type Visual =
  | { type: "bars"; title: string; unit: string; data: ChartPoint[]; source: string }
  | { type: "area"; title: string; unit: string; data: ChartPoint[]; source: string }
  | { type: "compare"; head: [string, string, string]; rows: [string, string, string][] }
  | { type: "flow"; steps: { label: string; sub: string }[] }
  | { type: "chips"; items: string[] };

export type Slide = { id: string; kicker: string; title: string; tagline: string; bullets: string[]; notes: string; visuals?: Visual[] };

export const SLIDES: Slide[] = [
  {
    id: "welcome",
    kicker: "INTRODUCING TECHTHRUST",
    title: "Build Smarter. Engage Better.",
    tagline: "Intelligent AI products, automation and technology solutions for business.",
    bullets: ["An AI-first technology company", "Based in the United Arab Emirates", "Serving businesses internationally"],
    notes: "TechThrust, legally TechThrust Digital Solutions FZC, is an AI-first technology company based in the United Arab Emirates and serving businesses internationally. We build intelligent AI products, automation and technology solutions that help businesses transform customer interactions and streamline operations.",
  },
  {
    id: "market",
    kicker: "THE MARKET",
    title: "Where the Market Is Heading",
    tagline: "Digital advertising keeps growing in both of our home markets.",
    bullets: ["India: roughly 14.5% a year growth", "UAE: roughly 14% a year growth", "Estimates vary by research firm; treat as indicative"],
    visuals: [
      {
        type: "area", title: "India digital advertising market", unit: "$B",
        data: [{ label: "2025", value: 8.2 }, { label: "2026", value: 9.4 }, { label: "2027", value: 10.8 }, { label: "2028", value: 12.3 }, { label: "2029", value: 14.1 }, { label: "2030", value: 16.2 }, { label: "2031", value: 18.5 }],
        source: "Ken Research: $8.2B in 2025 to $18.5B in 2031 at 14.5% CAGR (years between are interpolated)",
      },
      {
        type: "bars", title: "UAE digital advertising market", unit: "$B",
        data: [{ label: "2025", value: 2.29 }, { label: "2026", value: 2.64 }, { label: "2029", value: 4.3 }, { label: "2032", value: 5.9 }],
        source: "Ken Research, UAE digital advertising market forecast",
      },
    ],
    notes: "Digital advertising keeps growing in both of our home markets. According to Ken Research estimates, India's digital advertising market is about 8.2 billion dollars in 2025 and is projected to reach about 18.5 billion by 2031, roughly 14.5 percent a year. The same firm estimates the UAE digital advertising market at about 2.3 billion dollars in 2025, rising to about 5.9 billion by 2032. Different research firms publish different numbers, so treat these as indicative. The message: more customer conversations happen online, and businesses need smarter ways to handle them.",
  },
  {
    id: "voice-market",
    kicker: "THE MARKET",
    title: "AI Voice Is Taking Off",
    tagline: "Businesses are moving calls and follow-ups to AI agents.",
    bullets: ["Voice AI agents are among the fastest-growing software categories", "Analyst forecasts cluster around 30-40% yearly growth", "Estimates vary widely between firms"],
    visuals: [
      {
        type: "bars", title: "Global AI voice agents market", unit: "$B",
        data: [{ label: "2025", value: 2.54 }, { label: "2033", value: 35.24 }],
        source: "Grand View Research (39% CAGR), as cited by CloudTalk. Other analysts publish different bases.",
      },
    ],
    notes: "AI voice is one of the fastest-growing areas in business software. Grand View Research estimates the global AI voice agents market at about 2.5 billion dollars in 2025, growing to about 35 billion by 2033, around 39 percent a year. Other analysts use different definitions and publish different numbers, but they generally land between 30 and 40 percent annual growth. That is the space our products address.",
  },
  {
    id: "vision",
    kicker: "VISION & MISSION",
    title: "Technology should move business forward.",
    tagline: "We turn AI into meaningful business outcomes.",
    bullets: ["Vision: businesses that operate smarter, serve customers better and unlock new growth", "Mission: practical AI products, intelligent automation and technology solutions"],
    notes: "Our vision is a future where intelligent technology enables businesses to operate smarter, serve customers better and unlock new growth. Our mission is to empower businesses through practical AI products, intelligent automation and technology solutions. We don't build technology for technology's sake; we turn AI into meaningful business outcomes.",
  },
  {
    id: "approach",
    kicker: "OUR AI-FIRST APPROACH",
    title: "Understand → Identify → Deliver → Evolve",
    tagline: "A practical delivery framework. Actual phases depend on the agreed scope of each project.",
    bullets: ["One connected approach for every engagement"],
    visuals: [{ type: "flow", steps: [
      { label: "Understand", sub: "Business goals, customer needs, processes and pain points" },
      { label: "Identify", sub: "Where AI products, automation or tailored technology create value" },
      { label: "Deliver", sub: "Configure, implement and integrate the agreed solution" },
      { label: "Evolve", sub: "Review performance and improve as requirements change" },
    ] }],
    notes: "Our delivery framework has four steps. Understand: we learn about your business goals, customer needs, processes and pain points. Identify: we determine where AI products, automation or tailored technology could create value. Deliver: we configure, implement and integrate the agreed solution. Evolve: we review performance and identify improvements as requirements change. Actual phases depend on the scope agreed for each project.",
  },
  {
    id: "portfolio",
    kicker: "AI PRODUCT PORTFOLIO",
    title: "Three products. Distinct needs.",
    tagline: "Purpose-built AI products for customer engagement and communication.",
    bullets: ["Velynora: Unified Conversational AI Platform", "Velynora Lite: Automated Voice Calls & Follow-up Messaging", "Vocalis: AI-Powered Website Interaction Platform"],
    notes: "We offer three AI products for distinct needs. Velynora is a unified conversational AI platform for voice and chat agents. Velynora Lite delivers automated voice calls with follow-up messaging. Vocalis is an AI-powered website interaction platform that lets your website talk, think and act.",
  },
  {
    id: "velynora",
    kicker: "VELYNORA",
    title: "Turn customer conversations into business action.",
    tagline: "Build, launch and manage voice and chat agents across sales, support and operations.",
    bullets: ["Sales conversion and lead qualification", "Outbound campaigns", "Lead nurture and appointments", "Customer support", "Feedback and NPS", "Reception and booking"],
    notes: "Velynora is a conversational AI and automation platform for building and managing voice and chat agents. Its agents cover sales conversion and lead qualification, outbound campaigns, lead nurture and appointments, customer support, feedback and NPS, and reception and booking. Available capabilities vary by plan, configuration and deployment.",
  },
  {
    id: "velynora-lite",
    kicker: "VELYNORA LITE",
    title: "The right message. The right time. At scale.",
    tagline: "Scheduled one-way voice calls with WhatsApp or email follow-ups.",
    bullets: ["Automated voice calls", "WhatsApp or email follow-ups", "Appointment and event reminders", "Announcements and notifications", "Self-service or managed by TechThrust"],
    notes: "Velynora Lite handles routine reminders, announcements and follow-ups that are delayed or missed when done manually. It sends scheduled one-way voice calls with configured WhatsApp or email follow-ups, for appointment and event reminders, announcements and notifications. It can be self-service or managed by TechThrust.",
  },
  {
    id: "vocalis",
    kicker: "VOCALIS",
    title: "Your website. Now it talks, thinks and acts.",
    tagline: "Voice and text interaction right on your website.",
    bullets: ["Voice and text interaction", "Voice-directed navigation", "Discovery and recommendations", "Appointment booking and human handoff", "Shopify and WooCommerce", "80+ languages"],
    notes: "Vocalis is an AI-powered website interaction platform. Visitors can talk or type, and it guides navigation, helps them discover and get recommendations, books appointments and hands over to a human when needed. It works with Shopify and WooCommerce and supports more than 80 languages. In fact, the assistant you are talking to now is this kind of experience.",
  },
  {
    id: "services",
    kicker: "SERVICES & APPLICATIONS",
    title: "Technology that moves business forward.",
    tagline: "Services beyond software, for industries that run on customer conversations.",
    bullets: ["AI Automation", "AI Strategy, Consulting and Engineering", "Digital Growth Engine", "Startup-as-a-Service"],
    visuals: [{ type: "chips", items: INDUSTRIES.map((i) => i.name) }],
    notes: "Beyond products, we offer four services. AI Automation turns repetitive processes into intelligent workflows using AI agents, automation and system integrations. AI Strategy, Consulting and Engineering identifies the right AI opportunities and engineers production-ready solutions. The Digital Growth Engine connects acquisition with intelligent engagement, lead qualification and timely follow-up. Startup-as-a-Service is a structured journey from strategy and product planning to MVP, go-to-market readiness and evolution. We apply these across industries such as e-commerce, healthcare, real estate, hospitality, education, consulting, coaching and B2B.",
  },
  {
    id: "why",
    kicker: "WHERE WE STAND",
    title: "AI that works for business, not for its own sake.",
    tagline: "Four principles behind everything we do.",
    bullets: ["Values: innovation, transparency, results, partnership"],
    visuals: [{ type: "compare", head: ["", "Technology-first", "TechThrust"], rows: [
      ["Starting point", "The technology", "The business challenge"],
      ["Products", "Generic tools", "Purpose-built: Velynora, Velynora Lite, Vocalis"],
      ["Scope", "Software only", "Products, automation, integrations and implementation"],
      ["Focus", "Features", "Customer engagement, efficiency and growth"],
    ] }],
    notes: "What makes us different: we start with the business challenge, not the technology. Our products are purpose-built for practical customer engagement and communication needs. We combine AI products, intelligent automation, integrations and implementation services, so solutions go beyond software. And we focus on practical business outcomes, with clear objectives rather than unsupported promises. Our values are innovation, transparency, results and partnership.",
  },
  {
    id: "next",
    kicker: "NEXT STEP",
    title: "Let's Build What's Next.",
    tagline: "Tell us what you're trying to achieve.",
    bullets: ["Book a demo with our team", "info@tech-thrust.com", "WhatsApp +971 58 520 3369"],
    notes: "To get started, tell us what you are trying to achieve and we will discuss the right approach for your business. You can book a demo with our team, email info at tech-thrust dot com, or message us on WhatsApp at plus 971 58 520 3369.",
  },
];
