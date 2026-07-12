import { z } from "zod";

export const profileSchema = z.object({
    authorId: z.coerce.number(),
    status: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
});

export type ProfileSchemaType = z.infer<typeof profileSchema>;
