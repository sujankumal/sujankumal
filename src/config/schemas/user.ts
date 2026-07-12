import { z } from "zod";

export const userSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Valid email is required"),
    verified: z.boolean().default(false),
    image: z.string().nullable().optional(),
});

export type UserSchemaType = z.infer<typeof userSchema>;
