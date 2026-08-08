import { z } from "zod";

export const postSchema = z.object({
    title: z.string().min(3, "Title is too short").max(100, "Title is too long"),
    url: z.string().min(10).max(1024),
    description: z.string().nullable().optional(),
    main_image: z.string().min(1),
    main_image_credit: z.string().nullable().optional(),
    date: z.coerce.date(),
    month: z.number().int().min(1).max(12),
    year: z.number().int().min(2000).max(2100),
    published: z.boolean().default(false),
    authorId: z.coerce.number().nullable().optional(),
    categoryIds: z.array(z.coerce.number()).optional(),
    contentBlocks: z.array(z.object({
        type: z.string().min(1, "Block type is required"),
        content: z.string().nullable().optional(),
        sequence: z.coerce.number().optional(),
    })).optional(),
});

export type PostSchemaType = z.infer<typeof postSchema>;