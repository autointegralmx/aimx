import { z } from "zod";

export const publicLeadSchema = z.object({
  vehicleId: z.string().uuid(),
  sourcePage: z.string().trim().min(1).max(500),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(20)
    .regex(/^[0-9+\s()-]+$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().trim().min(8).max(120),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
});

export type PublicLeadInput = z.infer<typeof publicLeadSchema>;
