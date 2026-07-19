import { z } from "zod";

export const contentSchema = z.object({
    type: z.enum([
        "md",
        "text",
        "heading",
        "image",
        "quote",
        "gallery",
        "video",
    ]),
    content: z.string().min(100, "Content is too short").max(10000, "Content is too long"),
    sequence: z.coerce.number().min(0, "Sequence must be 0 or greater"),
    postId: z.coerce.number().min(1, "Post ID is required"),
});

export type ContentSchemaType = z.infer<typeof contentSchema>;