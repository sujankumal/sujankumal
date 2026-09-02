import { z } from "zod";

export const securityLogSchema = z.object({
    id: z.number().int().optional(),
    userId: z.number().int().nullable().optional(),
    event: z.string().min(1, "Event is required"),
    ipAddress: z.string().nullable().optional(),
    userAgent: z.string().nullable().optional(),
    details: z.string().nullable().optional(),
    createdAt: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()).optional(),
});

export type SecurityLogSchemaType = z.infer<typeof securityLogSchema>;
