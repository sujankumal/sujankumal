import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../services/auth";
import prisma from "../../../../../../prisma/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { revalidateEntityTags } from "@/services/revalidate";
import { getEntityConfig, normalizeData } from "@/config/entity-config";
import { getEntityModel } from "@/config/entity-server";

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
    const config = getEntityConfig(entity);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid entity" },
        { status: 400 }
      );
    }
    const defaultSort = config?.defaultSort ?? {
      field: "id",
      order: "desc",
    };

    let sortBy = searchParams.get("sortBy") ?? defaultSort.field;

    const sortOrder = searchParams.get("sortOrder") ?? defaultSort.order;

    const skip = (page - 1) * limit;

    let orderBy: any = { [sortBy]: sortOrder };

    const whereClause = config.searchable
      ? config.searchable(search)
      : {};

    // Get the appropriate Prisma model
    const model = await getEntityModel(entity);
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    const includeClause = config?.include ?? {};

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

    const config = getEntityConfig(entity);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid entity" },
        { status: 400 }
      );
    }

    // Preprocess data to handle empty strings as null for optional fields
    const preprocessedBody = { ...body };
    Object.keys(preprocessedBody).forEach(key => {
      if (preprocessedBody[key] === "" || preprocessedBody[key] === null) {
        preprocessedBody[key] = null;
      }
    });

    const validatedData = config.schema.parse(preprocessedBody);

    // Get the appropriate Prisma model
    const model = await getEntityModel(entity);
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Handle special cases for creation
    let createData = validatedData;
    if (config.beforeCreate) {
      createData = await config.beforeCreate(createData);
    }

    const newItem = await model.create({
      data: createData,
      include: config.include,
    });

    if (config.afterCreate) {
      await config.afterCreate(newItem);
    }

    // Purge cache tags for the affected entity
    revalidateEntityTags(entity, newItem.id);

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

    if (!id && entity !== "verificationtokens") {
      return NextResponse.json({ error: "ID is required for update" }, { status: 400 });
    }

    const config = getEntityConfig(entity);

    if (!config) {
      return NextResponse.json(
        { error: "Invalid entity" },
        { status: 400 }
      );
    }

    const validatedData = config.schema.parse(
      normalizeData(updateData)
    );

    // Get the appropriate Prisma model
    const model = await getEntityModel(entity);
    if (!model) {
      return NextResponse.json({ error: "Invalid entity" }, { status: 400 });
    }

    // Handle special cases for updates
    let finalUpdateData = validatedData;

    if (config.beforeUpdate) {
      finalUpdateData =
        await config.beforeUpdate(finalUpdateData);
    }

    const parsedId = (entity === "accounts" || entity === "sessions") ? id : parseInt(id);

    let updatedItem;
    if (entity === "categoriesonposts") {
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
    } else if (entity === "verificationtokens") {
      // Custom handler for compound tracking values
      updatedItem = await prisma.verificationToken.update({
        where: {
          identifier_token: {
            identifier: body.identifier,
            token: body.token,
          },
        },
        data: finalUpdateData,
      });
    } else {
      updatedItem = await model.update({
        where: { id: parsedId },
        data: finalUpdateData,
        include: config.include,
      });
    }
    if (config.afterUpdate) {
      await config.afterUpdate(updatedItem);
    }
    // Purge cache tags for the affected entity
    revalidateEntityTags(entity, id);

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

    if (!id && entity !== "verificationtokens") {
      return NextResponse.json({ error: "ID is required for deletion" }, { status: 400 });
    }

    const config = getEntityConfig(entity);

    const model = await getEntityModel(entity);
    if (!config || !model) {
      return NextResponse.json({ error: "Invalid entity metadata" }, { status: 400 });
    }

    const parsedId = (entity === "accounts" || entity === "sessions") ? id : parseInt(id!);

    // Check if item exists
    let existingItem;
    if (entity === "categoriesonposts") {
      existingItem = await prisma.categoriesOnPosts.findFirst({
        where: { id: parseInt(id!) },
      });
    } else if (entity === "verificationtokens") {
      const identifier = searchParams.get("identifier");
      const token = searchParams.get("token");
      if (!identifier || !token) {
        return NextResponse.json({ error: "Composite keys required" }, { status: 400 });
      }
      existingItem = await prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier, token } },
      });
    } else {
      existingItem = await model.findUnique({
        where: { id: parsedId },
      });
    }

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (config.beforeDelete) {
      await config.beforeDelete(existingItem);
    }
    if (entity === "categoriesonposts") {
      await prisma.categoriesOnPosts.delete({
        where: {
          postId_categoryId: {
            postId: existingItem.postId,
            categoryId: existingItem.categoryId,
          },
        },
      });
    } else if (entity === "verificationtokens") {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: existingItem.identifier,
            token: existingItem.token,
          },
        },
      });
    } else {
      await model.delete({
        where: { id: parsedId },
      });
    }

    if (config.afterDelete) {
      await config.afterDelete(existingItem);
    }
    // Purge cache tags for the deleted entity
    revalidateEntityTags(entity, id || 0);

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
