import { z } from "zod";

export const siteSchema = z.object({
    header_image: z.string().default("header.jpg"),
    header_image_credit: z.string().nullable().optional(),
    title: z.string().min(1, "Title is required"),
    name: z.string().min(1, "Name is required"),
    motto: z.string().min(1, "Motto is required"),
    greeting: z.string().min(1, "Greeting is required"),
    description: z.string().min(1, "Description is required"),
    detail: z.string().min(1, "Detail is required"),
    copyright: z.string().min(1, "Copyright is required"),
    year: z.coerce.number().min(1900).max(new Date().getFullYear() + 10),
    privacy_policy: z.string().nullable().optional(),
    contact_email: z.email().nullable().optional(),
    contact_phone: z.string().nullable().optional(),
});

export type SiteSchemaType = z.infer<typeof siteSchema>;