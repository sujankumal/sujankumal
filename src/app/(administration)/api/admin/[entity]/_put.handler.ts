import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../../../../prisma/prisma";
import { checkAdminAuth, validateRequest } from "./_middleware";
import { resolveEntity } from "@/services/entity-resolver";
import { normalizeData } from "@/config/entity-config";
import { revalidateEntityTags } from "@/services/revalidate";

// PUT - Update an existing entity record
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
    if (resolved instanceof NextResponse) return resolved;

    const { config, model, serverConfig } = resolved;

    // --- Validation ---
    let validatedData;
    try {
      validatedData = config.schema.parse(normalizeData(updateData));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation error",
            fields: Object.fromEntries(
              error.issues.map((issue) => [issue.path.join("."), issue.message])
            ),
          },
          { status: 400 }
        );
      }
      console.error("[admin-api:PUT validation]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // --- Pre-update hooks (config-level then server-level) ---
    let finalUpdateData = validatedData;
    if (config.beforeUpdate) {
      finalUpdateData = await config.beforeUpdate(finalUpdateData);
    }
    if (serverConfig?.beforeUpdate) {
      finalUpdateData = await serverConfig.beforeUpdate(finalUpdateData);
    }

    // --- Resolve where clause ---
    const where = config.resolveWhere
      ? await config.resolveWhere(body, prisma)
      : { [config.primaryKey ?? "id"]: body[config.primaryKey ?? "id"] };

    // Ensure the primary key never leaks into the data payload.
    // If it does (e.g. via a beforeUpdate hook or schema passthrough),
    // Prisma will attempt to overwrite the PK and throw P2002.
    const primaryKey = config.primaryKey ?? "id";
    const { [primaryKey]: _removedPk, id: _removedId, ...safeUpdateData } =
      finalUpdateData as any;

    console.log("[admin-api:PUT debug] where:", JSON.stringify(where));

    const updatedItem = await model.update({
      where,
      data: safeUpdateData,
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
      return NextResponse.json(
        {
          error: "Validation error",
          details: Object.fromEntries(
            error.issues.map((issue) => [issue.path.join("."), issue.message])
          ),
        },
        { status: 400 }
      );
    }
    console.error("[admin-api:PUT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
