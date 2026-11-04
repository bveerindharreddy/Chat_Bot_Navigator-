// Vocalis plans shown on /products/vocalis. Edit here: prices, included credits and features.
// price: null shows "Custom quote" with a demo button (no public price).
// Credits follow the console's billing rates (defaults: 1 credit per chat conversation, 2 per voice minute).

export type Plan = {
  id: string;
  name: string;
  for: string;
  price: string | null;
  period?: string;
  credits: number;
  websites: string;
  highlight?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    for: "One website getting started with an AI assistant",
    price: null,
    period: "/ month",
    credits: 1000,
    websites: "1 website",
    features: [
      "Chat and voice assistant",
      "Guides visitors around your site",
      "Lead capture with CSV export",
      "Suggested questions and pop-up greeting",
      "Your colours, icon and assistant name",
      "Email support",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    for: "Businesses that want leads flowing into their tools",
    price: null,
    period: "/ month",
    credits: 5000,
    websites: "Up to 3 websites",
    highlight: true,
    features: [
      "Everything in Starter",
      "Leads sent to your CRM, Zapier or Make",
      "Talk-to-a-human: call, WhatsApp, email",
      "Monthly report link for your team",
      "Prompt tuning from your website content",
      "Priority support",
    ],
  },
  {
    id: "agency",
    name: "Agency & Enterprise",
    for: "Agencies and multi-site brands",
    price: null,
    period: "/ month",
    credits: 25000,
    websites: "10+ websites",
    features: [
      "Everything in Growth",
      "White-label: remove our branding",
      "Client report links per website",
      "Custom voice and language setup",
      "Dedicated onboarding",
      "Service-level agreement",
    ],
  },
];

/** How far a credit goes at the default rates, in words a buyer understands. */
export const creditMeaning = (credits: number) =>
  `≈ ${credits.toLocaleString("en-US")} chat conversations or ${(credits / 2).toLocaleString("en-US")} voice minutes`;
