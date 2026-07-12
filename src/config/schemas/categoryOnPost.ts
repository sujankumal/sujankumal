import { z } from "zod";

export const categoryOnPostSchema = z.object({
    postId: z.coerce.number().min(1, "Post ID is required"),
    categoryId: z.coerce.number().min(1, "Category ID is required"),
});

export type CategoryOnPostSchemaType = z.infer<typeof categoryOnPostSchema>;