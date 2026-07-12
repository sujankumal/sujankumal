import { z } from "zod";

export const projectSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
});

export type ProjectSchemaType = z.infer<typeof projectSchema>;