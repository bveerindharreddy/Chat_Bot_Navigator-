// Shop items mirror the products and services on /products and /services. There are no fixed prices: the cart ends in a quote request.
export type Category = "AI Products" | "Services";
export type Product = { id: string; name: string; category: Category; blurb: string; includes: string[]; icon: string };

export const PRODUCTS: Product[] = [
  { id: "velynora", name: "Velynora", category: "AI Products", icon: "bot", blurb: "Unified conversational AI platform for voice and chat agents.", includes: ["Sales, support and reception agents", "Outbound campaigns", "Call logs, recordings and analytics"] },
  { id: "velynora-lite", name: "Velynora Lite", category: "AI Products", icon: "phone", blurb: "Automated voice calls with WhatsApp or email follow-ups.", includes: ["Appointment and event reminders", "Announcements and notifications", "Self-service or managed campaigns"] },
  { id: "vocalis", name: "Vocalis", category: "AI Products", icon: "message", blurb: "AI-powered website interaction: voice and text on your site.", includes: ["Voice-directed navigation", "Recommendations and booking", "Human handoff, 80+ languages"] },
  { id: "ai-automation", name: "AI Automation", category: "Services", icon: "zap", blurb: "Turn repetitive processes into intelligent workflows.", includes: ["AI agents and workflows", "System integrations", "Process automation"] },
  { id: "ai-strategy", name: "AI Strategy, Consulting & Engineering", category: "Services", icon: "brain", blurb: "Find the right AI opportunities and engineer production-ready solutions.", includes: ["Opportunity assessment", "Production-ready engineering", "Adoption support"] },
  { id: "digital-growth", name: "Digital Growth Engine", category: "Services", icon: "trending", blurb: "Connect acquisition with intelligent engagement and follow-up.", includes: ["Acquisition", "Intelligent engagement", "Lead qualification and follow-up"] },
  { id: "startup-as-a-service", name: "Startup-as-a-Service", category: "Services", icon: "rocket", blurb: "A structured journey from strategy to MVP and go-to-market.", includes: ["Strategy and product planning", "MVP build", "Go-to-market readiness and evolution"] },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);
