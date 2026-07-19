import { z } from "zod";

export const userSchema = z.object({
    name: z.string().min(3, "Name is too short").max(100, "Name is too long"),
    email: z.email("Valid email is required"),
    verified: z.boolean().default(false),
    image: z.string().nullable().optional(),
    password: z
        .string()
        .min(10, "Password must be at least 10 characters")
        .regex(/[A-Z]/, "Must contain an uppercase letter")
        .regex(/[a-z]/, "Must contain a lowercase letter")
        .regex(/[0-9]/, "Must contain a number")
        .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain at least one special character")
        .optional()
});

export type UserSchemaType = z.infer<typeof userSchema>;
