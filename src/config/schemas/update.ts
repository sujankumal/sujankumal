import { z } from "zod";

export const updateSchema = z.object({
    title: z.string().min(3, "Title is too short").max(100, "Title is too long"),
    update: z.string().min(10, "Update content is too short"),
    date: z.coerce.date().nullable().optional(),
});

export type UpdateSchemaType = z.infer<typeof updateSchema>;