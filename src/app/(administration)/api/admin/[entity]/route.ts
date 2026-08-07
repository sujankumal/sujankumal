import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../services/auth";
import prisma from "../../../../../../prisma/prisma";
import { z } from "zod";
import { headers } from "next/headers";
import { revalidateEntityTags } from "@/services/revalidate";
import { normalizeData } from "@/config/entity-config";
import { resolveEntity } from "@/services/entity-resolver";

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
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );

    const limit = Math.min(
      100, // max allowed
      Math.max(
        1,
        Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10
      )
    );
    const search = searchParams.get("search") || "";
    const resolved = await resolveEntity(entity);

    if (resolved instanceof NextResponse)
      return resolved;

    const { config, model, serverConfig } = resolved;

    const defaultSort = config?.defaultSort ?? {
      field: "id",
      order: "desc",
    };
    const sortableFields = config?.sortableFields ?? [
      "id",
      "title",
      "createdAt",
    ];
    const requestedSortBy = searchParams.get("sortBy");

    const sortBy =
      requestedSortBy &&
        config?.sortableFields?.includes(requestedSortBy)
        ? requestedSortBy
        : defaultSort.field;

    const requestedSortOrder = searchParams.get("sortOrder");

    const sortOrder =
      requestedSortOrder === "asc" || requestedSortOrder === "desc"
        ? requestedSortOrder
        : defaultSort.order;

    const skip = (page - 1) * limit;

    const orderBy: Record<string, "asc" | "desc"> = {
      [sortBy]: sortOrder,
    };

    const filtersParam = searchParams.get("filters");
    const parsedFilterConditions: any[] = [];

    const normalizeFilterValue = (rawValue: any, operator: string) => {
      if (rawValue === "true") return true;
      if (rawValue === "false") return false;

      if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        if (trimmed === "") return trimmed;

        if (["gt", "gte", "lt", "lte"].includes(operator)) {
          const dateValue = new Date(trimmed);
          if (!Number.isNaN(dateValue.getTime())) return dateValue;

          const numericValue = Number(trimmed);
          if (!Number.isNaN(numericValue)) return numericValue;
        }

        if (operator === "equals") {
          const numericValue = Number(trimmed);
          if (!Number.isNaN(numericValue)) return numericValue;

          const dateValue = new Date(trimmed);
          if (!Number.isNaN(dateValue.getTime())) return dateValue;
        }
      }

      return rawValue;
    };

    if (filtersParam) {
      try {
        const parsedFilters = JSON.parse(filtersParam);
        if (Array.isArray(parsedFilters)) {
          parsedFilters.forEach((filter) => {
            if (
              filter?.field &&
              filter?.operator &&
              filter?.value !== undefined &&
              filter?.value !== ""
            ) {
              const normalizedValue = normalizeFilterValue(filter.value, filter.operator);
              const condition: Record<string, any> = {};

              switch (filter.operator) {
                case "contains":
                  condition[filter.field] = { contains: normalizedValue, mode: "insensitive" };
                  break;
                case "startsWith":
                  condition[filter.field] = { startsWith: normalizedValue, mode: "insensitive" };
                  break;
                case "endsWith":
                  condition[filter.field] = { endsWith: normalizedValue, mode: "insensitive" };
                  break;
                case "equals":
                  condition[filter.field] = normalizedValue;
                  break;
                case "gt":
                case "gte":
                case "lt":
                case "lte":
                  condition[filter.field] = { [filter.operator]: normalizedValue };
                  break;
                default:
                  break;
              }

              if (Object.keys(condition).length) {
                parsedFilterConditions.push(condition);
              }
            }
          });
        }
      } catch (error) {
        // Ignore invalid filter payloads and continue with no filters.
      }
    }

    const searchClause = search && typeof config.searchable === "function"
      ? config.searchable(search)
      : {};

    const whereClause =
      (!searchClause || Object.keys(searchClause).length === 0) && parsedFilterConditions.length === 0
        ? {}
        : {
          AND: [
            ...(searchClause && Object.keys(searchClause).length ? [searchClause] : []),
            ...parsedFilterConditions,
          ],
        };

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
    const processedData = serverConfig?.afterRead
      ? await serverConfig.afterRead(items)
      : items;

    return NextResponse.json({
      items: processedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // console.error("[admin-api:GET]", error);
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
    const resolved = await resolveEntity(entity);

    if (resolved instanceof NextResponse)
      return resolved;

    const { config, model, serverConfig } = resolved;

    const validatedData = config.schema.parse(normalizeData(body));

    // Handle special cases for creation
    let createData = validatedData;
    if (config.beforeCreate) {
      createData = await config.beforeCreate(createData);
    }

    if (serverConfig?.beforeCreate) {
      createData = await serverConfig.beforeCreate(createData);
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
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: `Validation error: ${error.message}`,
        details: Object.fromEntries(
          error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ])
        ),
      }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    // console.error("[admin-api:POST]", error);
    return NextResponse.json({ error: `Internal server error: ${message}` }, { status: 500 });
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

    const resolved = await resolveEntity(entity);

    if (resolved instanceof NextResponse)
      return resolved;

    const { config, model, serverConfig } = resolved;

    let validatedData;
    try {
      validatedData = config.schema.parse(
        normalizeData(updateData)
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            fields: Object.fromEntries(
              error.issues.map(issue => [
                issue.path.join("."),
                issue.message,
              ])
            ),
          },
          { status: 400 }
        );
      }

      // console.error("[admin-api:PUT validation]", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    // Handle special cases for updates
    let finalUpdateData = validatedData;

    if (config.beforeUpdate) {
      finalUpdateData =
        await config.beforeUpdate(finalUpdateData);
    }

    if (serverConfig?.beforeUpdate) {
      finalUpdateData = await serverConfig.beforeUpdate(finalUpdateData);
    }

    const where = config.resolveWhere
      ? await config.resolveWhere(body, prisma)
      : {
        [config.primaryKey ?? "id"]: body[config.primaryKey ?? "id"],
      };
    const updatedItem = await model.update({
      where,
      data: finalUpdateData,
      include: config.include,
    });
    if (config.afterUpdate) {
      await config.afterUpdate(updatedItem);
    }
    // Purge cache tags for the affected entity
    revalidateEntityTags(entity, id);

    return NextResponse.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: "Validation error",
        details: Object.fromEntries(
          error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ])
        ),
      }, { status: 400 });
    }
    // console.error("[admin-api:PUT]", error);
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
    // const id = searchParams.get("id");

    const resolved = await resolveEntity(entity);

    if (resolved instanceof NextResponse)
      return resolved;

    const { config, model } = resolved;

    const input = normalizeData(Object.fromEntries(searchParams.entries()));
    const primaryKey = config.primaryKey ?? "id";
    const rawPrimaryValue = input[primaryKey];
    const parsedPrimaryValue = typeof rawPrimaryValue === "string" && rawPrimaryValue !== "" && !Number.isNaN(Number(rawPrimaryValue))
      ? Number(rawPrimaryValue)
      : rawPrimaryValue;

    const where = config.resolveWhere
      ? await config.resolveWhere(input, prisma)
      : {
        [primaryKey]: parsedPrimaryValue,
      };

    const existingItem = await model.findUnique({
      where,
    });

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (config.beforeDelete) {
      await config.beforeDelete(existingItem, prisma);
    }
    await model.delete({
      where,
    });

    if (config.afterDelete) {
      await config.afterDelete(existingItem, prisma);
    }
    // Purge cache tags for the deleted entity
    revalidateEntityTags(entity, where[config.primaryKey ?? "id"]);

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    // console.error("[admin-api:DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
