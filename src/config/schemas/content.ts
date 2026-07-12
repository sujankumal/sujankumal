import { z } from "zod";

export const contentSchema = z.object({
    type: z.string().min(1, "Type is required"),
    content: z.string().min(1, "Content is required"),
    sequence: z.coerce.number().min(0, "Sequence must be 0 or greater"),
    postId: z.coerce.number().min(1, "Post ID is required"),
});

export type ContentSchemaType = z.infer<typeof contentSchema>;