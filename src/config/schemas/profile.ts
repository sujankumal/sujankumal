import { z } from "zod";

export const profileSchema = z.object({
    authorId: z.coerce.number(),
    status: z.string().max(512).nullable().optional(),
    image: z.string().nullable().optional(),
    about: z.string().max(1024).nullable().optional(),
    phone: z.string().max(32).nullable().optional(),
    email: z.email().nullable().optional(),
});

export type ProfileSchemaType = z.infer<typeof profileSchema>;
