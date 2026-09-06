import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/services/auth";
import { database as adminDatabase } from "@/lib/firebase";
import { headers } from "next/headers";
import { requireVerifiedUser } from "@/services/authorization";

// Basic CSRF validation helper for write operations
async function validateRequest(request: NextRequest) {
  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");

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

// Clean and sanitize the path input to avoid injection/traversal issues
function sanitizePath(rawPath: string | null): string {
  if (!rawPath) return "/";

  // Replace backslashes with forward slashes
  let clean = rawPath.replace(/\\/g, "/");

  // Prevent parent directory traversal attempts
  clean = clean.split("/").filter(part => part !== ".." && part !== ".").join("/");

  // Ensure path starts with a single slash
  if (!clean.startsWith("/")) {
    clean = "/" + clean;
  }

  // Remove trailing slash if it's not the root path itself
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }

  return clean;
}

// GET: Read data from Firebase Realtime Database
export async function GET(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Realtime Database Admin SDK not initialized." }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get("path");
    const path = sanitizePath(rawPath);

    const snap = await adminDatabase.ref(path).once("value");

    return NextResponse.json({
      path,
      exists: snap.exists(),
      data: snap.val(),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

// PUT: Overwrite data at a path (or create a path)
export async function PUT(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Realtime Database Admin SDK not initialized." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const path = sanitizePath(body.path);
    const value = body.value;

    await adminDatabase.ref(path).set(value);

    return NextResponse.json({ success: true, path, message: "Data set successfully" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

// POST: Push data (generates a unique child ID under the path)
export async function POST(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Realtime Database Admin SDK not initialized." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const path = sanitizePath(body.path);
    const value = body.value;

    const newRef = await adminDatabase.ref(path).push(value);

    return NextResponse.json({
      success: true,
      path,
      key: newRef.key,
      fullPath: `${path}/${newRef.key}`,
      message: "Data pushed successfully",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

// PATCH: Partial updates on child nodes (merges keys instead of overwriting)
export async function PATCH(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Realtime Database Admin SDK not initialized." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const path = sanitizePath(body.path);
    const value = body.value;

    if (typeof value !== "object" || value === null) {
      return NextResponse.json({ error: "PATCH operation requires an object value to perform updates." }, { status: 400 });
    }

    await adminDatabase.ref(path).update(value);

    return NextResponse.json({ success: true, path, message: "Data updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}

// DELETE: Delete node at a path
export async function DELETE(request: NextRequest) {
  const authorization = await requireVerifiedUser();
  if (authorization.response) return authorization.response;

  const requestError = await validateRequest(request);
  if (requestError) return requestError;

  if (!adminDatabase) {
    return NextResponse.json({ error: "Firebase Realtime Database Admin SDK not initialized." }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawPath = searchParams.get("path");

    if (!rawPath || rawPath === "/") {
      return NextResponse.json({ error: "Deleting the root path '/' is forbidden for safety reasons." }, { status: 400 });
    }

    const path = sanitizePath(rawPath);

    await adminDatabase.ref(path).remove();

    return NextResponse.json({ success: true, path, message: "Data deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal server error" }, { status: 500 });
  }
}
