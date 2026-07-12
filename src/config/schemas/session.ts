import { z } from "zod";

export const sessionSchema = z.object({
    id: z.cuid2().optional(),
    sessionToken: z.string().min(1, "Session token is required"),
    userId: z.number().int(),
    expires: z.preprocess((val) => (typeof val === "string" ? new Date(val) : val), z.date()),
});

export type SessionSchemaType = z.infer<typeof sessionSchema>;
