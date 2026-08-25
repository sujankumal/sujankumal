import { z } from "zod";

export const siteSchema = z.object({
    header_image: z.string().min(1).default("header.jpg"),
    header_image_credit: z.string().nullable().optional(),
    title: z.string().min(2, "Title is required"),
    name: z.string().min(2, "Name is required"),
    motto: z.string().min(10, "Motto is required"),
    greeting: z.string().min(20, "Greeting is required"),
    description: z.string().min(50, "Description is required"),
    detail: z.string().min(200, "Detail is required"),
    copyright: z.string().min(2, "Copyright is required"),
    year: z.coerce.number().min(2000).max(new Date().getFullYear() + 10),
    privacy_policy: z.string().nullable().optional(),
    contact_email: z
        .email("Invalid email")
        .nullable()
        .optional(),
    contact_phone: z.string()
        .max(30).nullable().optional(),
});

export type SiteSchemaType = z.infer<typeof siteSchema>;