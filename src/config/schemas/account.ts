import { z } from "zod";

export const accountSchema = z.object({
    id: z.cuid2().optional(), // Optional if auto-generated on creation
    userId: z.number().int(),
    type: z.string().min(1, "Type is required"),
    provider: z.string().min(1, "Provider is required"),
    providerAccountId: z.string().min(1, "Provider Account ID is required"),
    refresh_token: z.string().nullable().optional(),
    access_token: z.string().nullable().optional(),
    expires_at: z.number().int().nullable().optional(),
    token_type: z.string().nullable().optional(),
    scope: z.string().nullable().optional(),
    id_token: z.string().nullable().optional(),
    session_state: z.string().nullable().optional(),
});

export type AccountSchemaType = z.infer<typeof accountSchema>;