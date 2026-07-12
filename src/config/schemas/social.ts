import { z } from "zod";

export const socialSchema = z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    embed: z.boolean().default(false),
});

export type SocialSchemaType = z.infer<typeof socialSchema>;