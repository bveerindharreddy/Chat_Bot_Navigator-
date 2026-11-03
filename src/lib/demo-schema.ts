import { z } from "zod";
import { PRODUCT_OPTIONS } from "./site";

export const demoSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z
    .string()
    .trim()
    .min(6, "Please enter a phone or WhatsApp number")
    .max(30)
    .regex(/^[+\d\s()-]+$/, "Use digits, spaces, + ( ) or -"),
  company: z.string().trim().min(1, "Please enter your company").max(150),
  product: z.enum(PRODUCT_OPTIONS, { errorMap: () => ({ message: "Please choose an option" }) }),
  message: z.string().trim().max(2000, "Please keep it under 2000 characters").default(""),
  sourcePage: z.string().max(200).optional(),
  // Honeypot: real visitors never fill this.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type DemoInput = z.infer<typeof demoSchema>;
