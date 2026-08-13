import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkAdminAuth, validateRequest } from "./_middleware";
import { resolveEntity } from "@/services/entity-resolver";
import { normalizeData } from "@/config/entity-config";
import { revalidateEntityTags } from "@/services/revalidate";

// POST - Create a new entity record
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
    if (resolved instanceof NextResponse) return resolved;

    const { config, model, serverConfig } = resolved;

    const validatedData = config.schema.parse(normalizeData(body));

    // Run pre-create hooks (config-level then server-level)
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
      return NextResponse.json(
        {
          error: `Validation error: ${error.message}`,
          details: Object.fromEntries(
            error.issues.map((issue) => [issue.path.join("."), issue.message])
          ),
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[admin-api:POST]", error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
