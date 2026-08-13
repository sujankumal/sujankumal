import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "./_middleware";
import { buildFilterConditions } from "./_filters";
import { resolveEntity } from "@/services/entity-resolver";

// GET - Read entities with pagination, sorting, search, and filtering
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ entity: string }> }
) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const { entity } = await context.params;
    const { searchParams } = new URL(request.url);

    // --- Pagination ---
    const page = Math.max(
      1,
      Number.parseInt(searchParams.get("page") ?? "1", 10) || 1
    );
    const limit = Math.min(
      100, // max allowed
      Math.max(1, Number.parseInt(searchParams.get("limit") ?? "10", 10) || 10)
    );
    const skip = (page - 1) * limit;

    // --- Entity resolution ---
    const resolved = await resolveEntity(entity);
    if (resolved instanceof NextResponse) return resolved;

    const { config, model, serverConfig } = resolved;

    // --- Sorting ---
    const defaultSort = config?.defaultSort ?? { field: "id", order: "desc" };
    const requestedSortBy = searchParams.get("sortBy");
    const sortBy =
      requestedSortBy && config?.sortableFields?.includes(requestedSortBy)
        ? requestedSortBy
        : defaultSort.field;

    const requestedSortOrder = searchParams.get("sortOrder");
    const sortOrder: "asc" | "desc" =
      requestedSortOrder === "asc" || requestedSortOrder === "desc"
        ? requestedSortOrder
        : defaultSort.order;

    const orderBy: Record<string, "asc" | "desc"> = { [sortBy]: sortOrder };

    // --- Search & filters ---
    const search = searchParams.get("search") || "";
    const searchClause =
      search && typeof config.searchable === "function"
        ? config.searchable(search)
        : {};

    const filterConditions = buildFilterConditions(searchParams.get("filters"));

    const hasSearch = searchClause && Object.keys(searchClause).length > 0;
    const whereClause =
      !hasSearch && filterConditions.length === 0
        ? {}
        : {
            AND: [
              ...(hasSearch ? [searchClause] : []),
              ...filterConditions,
            ],
          };

    // --- Query ---
    const includeClause = config?.include ?? {};
    const [items, total] = await Promise.all([
      model.findMany({ where: whereClause, orderBy, skip, take: limit, include: includeClause }),
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
    console.error("[admin-api:GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
