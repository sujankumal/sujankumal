import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../services/auth";
import prisma from "../../../../../../prisma/prisma";
import { z } from "zod";
import { headers } from "next/headers";

// Entity validation schemas
const entitySchemas = {
  post: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    main_image: z.string().min(1, "Main image is required"),
    main_image_credit: z.string().nullable().optional(),
    date: z.string().transform((str) => new Date(str)),
    published: z.boolean().default(false),
    authorId: z.coerce.number().nullable().optional(),
  }),
  category: z.object({
    name: z.string().min(1, "Name is required"),
  }),
  user: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Valid email is required"),
    verified: z.boolean().default(false),
    image: z.string().nullable().optional(),
  }),
  profile: z.object({
    authorId: z.coerce.number(),
    status: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
    about: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.email().nullable().optional(),
  }),
  project: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().nullable().optional(),
    link: z.string().nullable().optional(),
  }),
  social: z.object({
    name: z.string().min(1, "Name is required"),
    username: z.string().min(1, "Username is required"),
    embed: z.boolean().default(false),
  }),
  updates: z.object({
    title: z.string().min(1, "Title is required"),
    update: z.string().min(1, "Update content is required"),
    date: z.string().transform((str) => new Date(str)).optional(),
  }),
  site: z.object({
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
  }),
  content: z.object({
    type: z.string().min(1, "Type is required"),
    content: z.string().min(1, "Content is required"),
    sequence: z.coerce.number().min(0, "Sequence must be 0 or greater"),
    postId: z.coerce.number().min(1, "Post ID is required"),
  }),
  categoriesOnPosts: z.object({
    postId: z.coerce.number().min(1, "Post ID is required"),
    categoryId: z.coerce.number().min(1, "Category ID is required"),
  }),
};

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user?.verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Helper function to validate request origin and headers
async function validateRequest(request: NextRequest) {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");

  // Basic CSRF protection - ensure request comes from same origin
  if (request.method !== "GET") {
    const host = headersList.get("host");
    if (!origin && !referer) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    if (origin && !origin.includes(host || "")) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }

    if (referer && !referer.includes(host || "")) {
      return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
    }
  }

  return null;
}

// GET - Read entities with pagination
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const { entity } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    let sortBy = searchParams.get("sortBy") || "id";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Fallback sort field for entities that do not have an 'id' field (like verificationToken)
    if (entity === "verificationToken" && sortBy === "id") {
      sortBy = "identifier";
    }

    const skip = (page - 1) * limit;

    let whereClause: any = {};
    let orderBy: any = { [sortBy]: sortOrder };

    // Add search functionality for different entities
    if (search) {
      switch (entity) {
        case "post":
          whereClause = {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
              { author: { name: { contains: search, mode: "insensitive" } } },
            ],
          };
          break;
        case "category":
          whereClause = { name: { contains: search, mode: "insensitive" } };
          break;
        case "user":
          whereClause = {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          };
          break;
        case "content":
          whereClause = {
            OR: [
              { type: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
              { post: { title: { contains: search, mode: "insensitive" } } },
            ],
          };
          break;
        case "categoriesOnPosts":
          whereClause = {
            OR: [
              { post: { title: { contains: search, mode: "insensitive" } } },
              { category: { name: { contains: search, mode: "insensitive" } } },
            ],
          };
          break;
        case "profile":
          whereClause = {
            OR: [
              { status: { contains: search, mode: "insensitive" } },
              { about: { contains: search, mode: "insensitive" } },
              { author: { name: { contains: search, mode: "insensitive" } } },
            ],
          };
          break;
        case "verificationToken":
          whereClause = {
            OR: [
              { identifier: { contains: search, mode: "insensitive" } },
              { token: { contains: search, mode: "insensitive" } },
            ],
          };
          break;
        default:
          // For other entities, search in name or title field if available
          const searchField = entity === "project" ? "title" : "name";
          if (searchField) {
            whereClause = { [searchField]: { contains: search, mode: "insensitive" } };
          }
      }
    }

    // Get the appropriate Prisma model
    const model = (prisma as any)[entity];
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Include related data for certain entities
    let includeClause: any = {};
    switch (entity) {
      case "post":
        includeClause = {
          author: { select: { id: true, name: true, email: true } },
          categories: {
            include: {
              category: { select: { id: true, name: true } }
            }
          },
          content: true,
        };
        break;
      case "user":
        includeClause = {
          profile: true,
          posts: { select: { id: true, title: true } }
        };
        break;
      case "category":
        includeClause = {
          posts: {
            include: {
              post: { select: { id: true, title: true } }
            }
          }
        };
        break;
      case "profile":
        includeClause = {
          author: { select: { id: true, name: true, email: true } }
        };
        break;
      case "content":
        includeClause = {
          post: { select: { id: true, title: true } }
        };
        break;
      case "categoriesOnPosts":
        includeClause = {
          post: { select: { id: true, title: true } },
          category: { select: { id: true, name: true } }
        };
        break;
    }

    const [items, total] = await Promise.all([
      model.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: includeClause,
      }),
      model.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new entity
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  try {
    const { entity } = await context.params;
    const body = await request.json();

    // Validate input based on entity type
    const schema = (entitySchemas as any)[entity];
    if (!schema) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Preprocess data to handle empty strings as null for optional fields
    const preprocessedBody = { ...body };
    Object.keys(preprocessedBody).forEach(key => {
      if (preprocessedBody[key] === "" || preprocessedBody[key] === null) {
        preprocessedBody[key] = null;
      }
    });

    const validatedData = schema.parse(preprocessedBody);

    // Get the appropriate Prisma model
    const model = (prisma as any)[entity];
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Handle special cases for creation
    let createData = validatedData;
    if (entity === "post") {
      // Set current date if not provided
      if (!createData.date) {
        createData.date = new Date();
      }
      // Set month and year for posts
      const date = new Date(createData.date);
      createData.month = date.getMonth() + 1;
      createData.year = date.getFullYear();
    }

    const newItem = await model.create({
      data: createData,
      include: entity === "post" ? { author: true, categories: { include: { category: true } } } : undefined,
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update entity
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  try {
    const { entity } = await context.params;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
    }

    // Validate input based on entity type
    const schema = (entitySchemas as any)[entity];
    if (!schema) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Preprocess data to handle empty strings as null for optional fields
    const preprocessedData = { ...updateData };
    Object.keys(preprocessedData).forEach(key => {
      if (preprocessedData[key] === "" || preprocessedData[key] === null) {
        preprocessedData[key] = null;
      }
    });

    const validatedData = schema.partial().parse(preprocessedData);

    // Get the appropriate Prisma model
    const model = (prisma as any)[entity];
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Handle special cases for updates
    let finalUpdateData = validatedData;
    if (entity === "post" && validatedData.date) {
      const date = new Date(validatedData.date);
      finalUpdateData.month = date.getMonth() + 1;
      finalUpdateData.year = date.getFullYear();
    }

    let updatedItem;
    if (entity === "categoriesOnPosts") {
      const existingItem = await prisma.categoriesOnPosts.findFirst({
        where: { id: parseInt(id) },
      });
      if (!existingItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }
      updatedItem = await prisma.categoriesOnPosts.update({
        where: {
          postId_categoryId: {
            postId: existingItem.postId,
            categoryId: existingItem.categoryId,
          },
        },
        data: finalUpdateData,
      });
    } else {
      updatedItem = await model.update({
        where: { id: parseInt(id) },
        data: finalUpdateData,
        include: entity === "post" ? { author: true, categories: { include: { category: true } } } : undefined,
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error("PUT error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete entity
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  try {
    const { entity } = await context.params;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required for deletion" }, { status: 400 });
    }

    // Get the appropriate Prisma model
    const model = (prisma as any)[entity];
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Check if item exists
    let existingItem;
    if (entity === "categoriesOnPosts") {
      existingItem = await prisma.categoriesOnPosts.findFirst({
        where: { id: parseInt(id) },
      });
    } else {
      existingItem = await model.findUnique({
        where: { id: parseInt(id) },
      });
    }

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (entity === "categoriesOnPosts") {
      await prisma.categoriesOnPosts.delete({
        where: {
          postId_categoryId: {
            postId: existingItem.postId,
            categoryId: existingItem.categoryId,
          },
        },
      });
    } else {
      await model.delete({
        where: { id: parseInt(id) },
      });
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
