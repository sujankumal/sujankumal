import { z } from "zod";

export const postSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    main_image: z.string().min(1),
    main_image_credit: z.string().nullable().optional(),
    date: z.string().transform(str => new Date(str)),
    published: z.boolean().default(false),
    authorId: z.coerce.number().nullable().optional(),
});

export type PostSchemaType = z.infer<typeof postSchema>;