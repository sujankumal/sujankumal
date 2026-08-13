import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../prisma/prisma";
import { checkAdminAuth, validateRequest } from "./_middleware";
import { resolveEntity } from "@/services/entity-resolver";
import { normalizeData } from "@/config/entity-config";
import { revalidateEntityTags } from "@/services/revalidate";

// DELETE - Remove an entity record
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

    const resolved = await resolveEntity(entity);
    if (resolved instanceof NextResponse) return resolved;

    const { config, model } = resolved;

    // --- Resolve primary key from query params ---
    const input = normalizeData(Object.fromEntries(searchParams.entries()));
    const primaryKey = config.primaryKey ?? "id";
    const rawPrimaryValue = input[primaryKey];
    const parsedPrimaryValue =
      typeof rawPrimaryValue === "string" &&
      rawPrimaryValue !== "" &&
      !Number.isNaN(Number(rawPrimaryValue))
        ? Number(rawPrimaryValue)
        : rawPrimaryValue;

    const where = config.resolveWhere
      ? await config.resolveWhere(input, prisma)
      : { [primaryKey]: parsedPrimaryValue };

    // --- Guard: item must exist before deletion ---
    const existingItem = await model.findUnique({ where });
    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (config.beforeDelete) {
      await config.beforeDelete(existingItem, prisma);
    }

    await model.delete({ where });

    if (config.afterDelete) {
      await config.afterDelete(existingItem, prisma);
    }

    // Purge cache tags for the deleted entity
    revalidateEntityTags(entity, where[config.primaryKey ?? "id"]);

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("[admin-api:DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
