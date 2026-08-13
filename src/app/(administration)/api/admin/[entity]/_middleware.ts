import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../services/auth";
import { headers } from "next/headers";

/**
 * Checks that the current session belongs to a verified admin user.
 * Returns a 401 response if not, or null if auth passes.
 */
export async function checkAdminAuth(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Validates the request origin / referer headers for basic CSRF protection.
 * Only applied to non-GET requests.
 * Returns a 403 response if the check fails, or null if it passes.
 */
export async function validateRequest(
  request: NextRequest
): Promise<NextResponse | null> {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");

  if (request.method !== "GET") {
    const host = headersList.get("host");
    if (!origin && !referer) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    if (origin && !origin.includes(host || "")) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    if (referer && !referer.includes(host || "")) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }
  }

  return null;
}
