import { z } from "zod";

export const updateSchema = z.object({
    title: z.string().min(1, "Title is required"),
    update: z.string().min(1, "Update content is required"),
    date: z.string().transform((str) => new Date(str)).optional(),
});

export type UpdateSchemaType = z.infer<typeof updateSchema>;