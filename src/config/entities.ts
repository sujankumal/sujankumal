import { AdminEntity } from "./types";
import { postSchema } from "./schemas/post";
import { categorySchema } from "./schemas/category";
import { categoryOnPostSchema } from "./schemas/categoryOnPost";
import { contentSchema } from "./schemas/content";
import { projectSchema } from "./schemas/project";
import { socialSchema } from "./schemas/social";
import { updateSchema } from "./schemas/update";
import { siteSchema } from "./schemas/site";
import { userSchema } from "./schemas/user";
import { profileSchema } from "./schemas/profile";
import { accountSchema } from "./schemas/account";
import { sessionSchema } from "./schemas/session";
import { verificationTokenSchema } from "./schemas/verificationtoken";

export const ENTITY_NAMES = [
    "sites",
    "updates",
    "socials",
    "projects",
    "posts",
    "content",
    "categories",
    "categoriesonposts",
    "users",
    "profiles",
    "accounts",
    "sessions",
    "verificationtokens",
] as const;

export type EntityName = typeof ENTITY_NAMES[number];

export type AdminEntities = Record<EntityName, AdminEntity>;

export const adminEntities: AdminEntities = {
    sites: {
        primaryKey: "id",
        title: "Sites",
        schema: siteSchema,
        searchable: (search: string) => ({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { name: { contains: search, mode: "insensitive" } },
                { motto: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { contact_email: { contains: search, mode: "insensitive" } },
            ],
        }),
        columns: [
            { field: "title", label: "Title", renderer: "text", sortable: true },
            { field: "name", label: "Name", renderer: "text", sortable: true },
            { field: "motto", label: "Motto", renderer: "text" },
            { field: "greeting", label: "Greeting", renderer: "text" },
            { field: "header_image", label: "Header Image", renderer: "image" },
            { field: "year", label: "Year", renderer: "number", sortable: true },
            { field: "contact_email", label: "Contact Email", renderer: "text" },
        ],
        form: [
            { name: "title", label: "Title", control: "text", required: true },
            { name: "name", label: "Name", control: "text", required: true },
            { name: "motto", label: "Motto", control: "text", required: true },
            { name: "greeting", label: "Greeting", control: "text", required: true },
            { name: "description", label: "Description", control: "textarea", required: true },
            { name: "detail", label: "Detail", control: "textarea", required: true },
            { name: "header_image", label: "Header Image", control: "image" },
            { name: "header_image_credit", label: "Header Image Credit", control: "text" },
            { name: "copyright", label: "Copyright", control: "text", required: true },
            { name: "year", label: "Year", control: "number", required: true },
            { name: "privacy_policy", label: "Privacy Policy", control: "textarea" },
            { name: "contact_email", label: "Contact Email", control: "text" },
            { name: "contact_phone", label: "Contact Phone", control: "text" },
        ],
    },

    updates: {
        primaryKey: "id",
        title: "Updates",
        schema: updateSchema,
        searchable: (search: string) => ({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { update: { contains: search, mode: "insensitive" } },
            ],
        }),
        columns: [
            { field: "title", label: "Title", renderer: "text", sortable: true },
            { field: "update", label: "Update Content", renderer: "markdown" },
            { field: "date", label: "Date", renderer: "date", sortable: true },
        ],
        form: [
            { name: "title", label: "Title", control: "text", required: true },
            { name: "update", label: "Update Content", control: "markdown", required: true },
            { name: "date", label: "Date", control: "date" },
        ],
    },

    socials: {
        primaryKey: "id",
        title: "Social Links",
        schema: socialSchema,
        searchable: (search: string) => ({
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { username: { contains: search, mode: "insensitive" } },
            ],
        }),
        columns: [
            { field: "name", label: "Platform Name", renderer: "text", sortable: true },
            { field: "username", label: "Username", renderer: "text", sortable: true },
            { field: "embed", label: "Embed Enabled", renderer: "boolean" },
        ],
        form: [
            { name: "name", label: "Platform Name", control: "text", required: true },
            { name: "username", label: "Username", control: "text", required: true },
            { name: "embed", label: "Embed Enabled", control: "boolean" },
        ],
    },

    projects: {
        primaryKey: "id",
        title: "Projects",
        schema: projectSchema,
        searchable: (search: string) => ({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { link: { contains: search, mode: "insensitive" } },
            ],
        }),
        include: {},
        defaultSort: {
            field: "id",
            order: "desc",
        },
        columns: [
            { field: "title", label: "Project Title", renderer: "text", sortable: true },
            { field: "description", label: "Description", renderer: "markdown" },
            { field: "link", label: "Project Link", renderer: "text" },
        ],
        form: [
            { name: "title", label: "Project Title", control: "text", required: true },
            { name: "description", label: "Description", control: "markdown" },
            { name: "link", label: "Project Link", control: "text" },
        ],
    },

    posts: {
        primaryKey: "id",
        title: "Posts",
        schema: postSchema,
        searchable: (search: string) => ({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { author: { name: { contains: search, mode: "insensitive" } } },
            ],
        }),
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            categories: {
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
            },
            content: true,
        },
        defaultSort: {
            field: "date",
            order: "desc",
        },
        columns: [
            { field: "title", label: "Title", renderer: "text", sortable: true },
            { field: "main_image", label: "Image", renderer: "image" },
            { field: "author", label: "Author", renderer: "relation", display: "name" },
            { field: "published", label: "Published", renderer: "boolean" },
            { field: "date", label: "Date", renderer: "date", sortable: true },
            { field: "categories", label: "Categories", renderer: "manyToMany", display: "name" },
        ],
        form: [
            { name: "title", label: "Title", control: "text", required: true },
            { name: "url", label: "URL Path", control: "text", required: true },
            { name: "description", label: "Description", control: "markdown" },
            { name: "main_image", label: "Main Image", control: "image", required: true },
            { name: "main_image_credit", label: "Main Image Credit", control: "text" },
            { name: "date", label: "Publish Date", control: "date", required: true },
            { name: "month", label: "Month Int", control: "number" },
            { name: "year", label: "Year Int", control: "number" },
            { name: "published", label: "Published", control: "boolean" },
            {
                name: "authorId",
                label: "Author",
                control: "relation",
                relation: {
                    entity: "users",
                    value: "id",
                    label: "name",
                },
                display: "name",
            },
        ],
        beforeCreate(data) {
            const date = data.date ? new Date(data.date) : new Date();
            return {
                ...data,
                date,
                month: date.getMonth() + 1,
                year: date.getFullYear(),
            };
        },
        beforeUpdate(data) {
            if (!data.date) return data;
            const date = new Date(data.date);
            return {
                ...data,
                date,
                month: date.getMonth() + 1,
                year: date.getFullYear(),
            };
        },
    },

    content: {
        primaryKey: "id",
        title: "Post Content Blocks",
        schema: contentSchema,
        include: {
            post: {
                select: {
                    id: true,
                    title: true,
                },
            }
        },
        searchable: (search: string) => ({
            OR: [
                { type: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
                { post: { title: { contains: search, mode: "insensitive" } } },
            ],
        }),
        columns: [
            { field: "post", label: "Belongs to Post", renderer: "relation", display: "title" },
            { field: "type", label: "Block Type", renderer: "text", sortable: true },
            { field: "content", label: "Content Body", renderer: "markdown" },
            { field: "sequence", label: "Order Sequence", renderer: "number", sortable: true },
        ],
        form: [
            {
                name: "postId",
                label: "Post",
                control: "relation",
                relation: {
                    entity: "posts",
                    value: "id",
                    label: "title",
                },
                display: "title",
            },
            { name: "type", label: "Block Type", control: "text", required: true },
            { name: "content", label: "Content Body", control: "markdown" },
            { name: "sequence", label: "Order Sequence", control: "number" },
        ],
    },

    categories: {
        primaryKey: "id",
        title: "Categories",
        schema: categorySchema,
        searchable: (search: string) => ({
            name: { contains: search, mode: "insensitive" },
        }),
        columns: [
            { field: "name", label: "Category Name", renderer: "text", sortable: true },
        ],
        form: [
            { name: "name", label: "Category Name", control: "text", required: true },
        ],
    },

    categoriesonposts: {
        primaryKey: undefined,
        title: "Category Post Joins",
        schema: categoryOnPostSchema,
        resolveWhere: async ({ id }, prisma) => {
            const row = await prisma.categoriesOnPosts.findFirst({
                where: {
                    id: Number(id),
                },
            });

            if (!row) {
                throw new Error("NOT_FOUND");
            }

            return {
                postId_categoryId: {
                    postId: row.postId,
                    categoryId: row.categoryId,
                },
            };
        },
        include: {
            post: {
                select: {
                    id: true,
                    title: true,
                },
            },
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        searchable: (search: string) => ({
            OR: [
                { post: { title: { contains: search, mode: "insensitive" } } },
                { category: { name: { contains: search, mode: "insensitive" } } },
            ],
        }),
        columns: [
            { field: "post", label: "Post", renderer: "relation", display: "title" },
            { field: "category", label: "Category", renderer: "relation", display: "name" },
        ],
        form: [
            {
                name: "postId",
                label: "Post",
                control: "relation",
                relation: {
                    entity: "posts",
                    value: "id",
                    label: "title",
                },
                display: "title",
                required: true,
            },
            {
                name: "categoryId",
                label: "Category",
                control: "relation",
                relation: {
                    entity: "categories",
                    value: "id",
                    label: "name",
                },
                display: "name",
                required: true,
            },
        ],
    },

    users: {
        primaryKey: "id",
        title: "Users",
        schema: userSchema,
        searchable: (search: string) => ({
            OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ],
        }),
        include: {
            profile: true,
            posts: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
        defaultSort: {
            field: "createdAt",
            order: "desc",
        },
        columns: [
            { field: "name", label: "Full Name", renderer: "text", sortable: true },
            { field: "email", label: "Email Address", renderer: "text", sortable: true },
            { field: "image", label: "Avatar", renderer: "image" },
            { field: "verified", label: "Verified Account", renderer: "boolean", sortable: true },
            { field: "createdAt", label: "Joined Date", renderer: "date", sortable: true },
        ],
        form: [
            { name: "name", label: "Full Name", control: "text" },
            { name: "email", label: "Email Address", control: "text" },
            {
                name: "password",
                label: "New Password",
                control: "text",
                required: false,
                placeholder: "Leave blank to keep current password"
            },
            { name: "verified", label: "Verified Account", control: "boolean" },
            { name: "image", label: "Avatar URL", control: "image" },
            { name: "emailVerified", label: "Email Verified At", control: "date" },
        ],

        beforeCreate: async (data) => {
            return data;
        },

        beforeUpdate: async (data) => {
            return data;
        },
    },

    profiles: {
        primaryKey: "id",
        title: "User Profiles",
        schema: profileSchema,
        include: {
            author: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        },
        searchable: (search: string) => ({
            OR: [
                { status: { contains: search, mode: "insensitive" } },
                { about: { contains: search, mode: "insensitive" } },
                { phone: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
                { author: { name: { contains: search, mode: "insensitive" } } },
            ],
        }),
        columns: [
            { field: "author", label: "User", renderer: "relation", display: "name" },
            { field: "image", label: "Profile Picture", renderer: "image" },
            { field: "status", label: "Status Heading", renderer: "text" },
            { field: "about", label: "About Bio", renderer: "markdown" },
            { field: "phone", label: "Phone Number", renderer: "text" },
        ],
        form: [
            {
                name: "authorId",
                label: "User",
                control: "relation",
                relation: {
                    entity: "users",
                    value: "id",
                    label: "name",
                },
                display: "name",
            },
            { name: "status", label: "Status Heading", control: "text" },
            { name: "image", label: "Profile Picture URL", control: "image" },
            { name: "about", label: "About Bio", control: "markdown" },
            { name: "phone", label: "Phone Number", control: "text" },
            { name: "email", label: "Public Email", control: "text" },
        ],
    },

    accounts: {
        primaryKey: "id",
        title: "OAuth Accounts",
        schema: accountSchema,
        searchable: (search: string) => ({
            OR: [
                { provider: { contains: search, mode: "insensitive" } },
                { type: { contains: search, mode: "insensitive" } },
                { scope: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
            ],
        }),
        columns: [
            { field: "user", label: "User", renderer: "relation", display: "email" },
            { field: "provider", label: "Provider (e.g. Google)", renderer: "text", sortable: true },
            { field: "type", label: "Account Type", renderer: "text" },
            { field: "scope", label: "Granted Scopes", renderer: "text" },
        ],
        form: [
            {
                name: "userId",
                label: "User",
                control: "relation",
                relation: {
                    entity: "users",
                    value: "id",
                    label: "email",
                },
                display: "email",
                required: true,
            },
            { name: "type", label: "Account Type", control: "text", required: true },
            { name: "provider", label: "Provider", control: "text", required: true },
            { name: "providerAccountId", label: "Provider Account ID", control: "text", required: true },
            { name: "refresh_token", label: "Refresh Token", control: "textarea" },
            { name: "access_token", label: "Access Token", control: "textarea" },
            { name: "expires_at", label: "Expires At (Timestamp)", control: "number" },
            { name: "token_type", label: "Token Type", control: "text" },
            { name: "scope", label: "Scopes", control: "text" },
            { name: "id_token", label: "ID Token", control: "textarea" },
            { name: "session_state", label: "Session State", control: "text" },
        ],
    },

    sessions: {
        primaryKey: "id",
        title: "User Sessions",
        schema: sessionSchema,
        searchable: (search: string) => ({
            OR: [
                { sessionToken: { contains: search, mode: "insensitive" } },
                { user: { email: { contains: search, mode: "insensitive" } } },
                { user: { name: { contains: search, mode: "insensitive" } } },
            ],
        }),
        columns: [
            { field: "user", label: "User", renderer: "relation", display: "email" },
            { field: "sessionToken", label: "Session Token", renderer: "text" },
            { field: "expires", label: "Expiration Date", renderer: "date", sortable: true },
        ],
        form: [
            { name: "sessionToken", label: "Session Token", control: "text", required: true },
            {
                name: "userId",
                label: "User",
                control: "relation",
                relation: {
                    entity: "users",
                    value: "id",
                    label: "email",
                },
                display: "email",
                required: true,
            },
            { name: "expires", label: "Expiration Date", control: "date", required: true },
        ],
    },

    verificationtokens: {
        primaryKey: undefined,
        title: "Verification Tokens",
        schema: verificationTokenSchema,
        resolveWhere: ({ identifier, token }) => {
            if (!identifier || !token) {
                throw new Error("Identifier and token are required");
            }
            return {
                identifier_token: {
                    identifier,
                    token,
                },
            };
        },
        defaultSort: {
            field: "expires",
            order: "desc",
        },
        sortableFields: [
            "identifier",
            "token",
            "expires",
        ],
        searchable: (search: string) => ({
            OR: [
                { identifier: { contains: search, mode: "insensitive" } },
                { token: { contains: search, mode: "insensitive" } },
            ],
        }),
        columns: [
            { field: "identifier", label: "Identifier (Email/User)", renderer: "text", sortable: true },
            { field: "token", label: "Secure Token", renderer: "text" },
            { field: "expires", label: "Expiration Date", renderer: "date", sortable: true },
        ],
        form: [
            { name: "identifier", label: "Identifier", control: "text", required: true },
            { name: "token", label: "Token", control: "text", required: true },
            { name: "expires", label: "Expiration Date", control: "date", required: true },
        ],
    },
};