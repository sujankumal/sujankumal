import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../services/auth";
import prisma from "../../../../../../prisma/prisma";

// Helper function to check admin authorization
async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user?.verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// GET - Fetch related data for dropdowns
export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");

    if (!entity) {
      return NextResponse.json({ error: "Entity parameter is required" }, { status: 400 });
    }

    let relationData: any = {};

    switch (entity) {
      case "post":
        relationData = {
          authors: await prisma.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" }
          }),
          categories: await prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
          })
        };
        break;

      case "profile":
        relationData = {
          authors: await prisma.user.findMany({
            select: { id: true, name: true, email: true },
            orderBy: { name: "asc" }
          })
        };
        break;

      case "content":
        relationData = {
          posts: await prisma.post.findMany({
            select: { id: true, title: true },
            orderBy: { title: "asc" }
          })
        };
        break;

      case "categoriesOnPosts":
        relationData = {
          posts: await prisma.post.findMany({
            select: { id: true, title: true },
            orderBy: { title: "asc" }
          }),
          categories: await prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: "asc" }
          })
        };
        break;

      default:
        return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
    }

    return NextResponse.json(relationData);
  } catch (error) {
    console.error("Relations API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
