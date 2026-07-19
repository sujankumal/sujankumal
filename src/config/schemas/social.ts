import { z } from "zod";

export const socialSchema = z.object({
    name: z.string()
        .min(2, "Name is too short")
        .max(30, "Name is too long")
        .trim()
        .regex(/^[a-zA-Z]+$/, "Name must contain only letters"),
    username: z.string()
        .min(2, "Username is too short")
        .max(30, "Username is too long")
        .trim()
        .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores"),
    embed: z.boolean().default(false),
});

export type SocialSchemaType = z.infer<typeof socialSchema>;