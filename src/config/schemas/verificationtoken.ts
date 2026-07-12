import { z } from "zod";

export const verificationTokenSchema = z.object({
    identifier: z.string().min(1, "Identifier is required"),
    token: z.string().min(1, "Token is required"),
    expires: z.date(),
});

export type VerificationTokenSchemaType = z.infer<typeof verificationTokenSchema>;