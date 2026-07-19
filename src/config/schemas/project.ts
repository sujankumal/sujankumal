import { z } from "zod";

export const projectSchema = z.object({
    title: z.string().min(2, "Title is too short").max(50, "Title is too long"),
    description: z.string().nullable().optional(),
    link: z.url("Please provide a valid URL").nullable().optional(),
});

export type ProjectSchemaType = z.infer<typeof projectSchema>;