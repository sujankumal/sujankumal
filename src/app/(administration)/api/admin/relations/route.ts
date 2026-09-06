import { NextRequest, NextResponse } from "next/server";
import { getEntityModel } from "@/config/entity-server";
import { requireVerifiedUser } from "@/services/authorization";

// GET - Fetch related data for dropdowns
// Accepts ?entity=users,categories (comma-separated entity names from config)
export async function GET(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  try {
    const { searchParams } = new URL(request.url);
    const entityParam = searchParams.get("entity");

    if (!entityParam) {
      return NextResponse.json({ error: "Entity parameter is required" }, { status: 400 });
    }

    const entityNames = entityParam.split(",").map(e => e.trim()).filter(Boolean);
    const relationData: Record<string, any[]> = {};

    for (const entityName of entityNames) {
      const model = await getEntityModel(entityName);
      if (!model) {
        continue;
      }

      try {
        relationData[entityName] = await model.findMany({
          take: 200, // Limit to prevent fetching entire tables
          orderBy: { id: "asc" },
        });
      } catch (err) {
        relationData[entityName] = [];
      }
    }

    return NextResponse.json(relationData);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
