import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/services/auth";

const addUrlSchema = z.object({
  longUrl: z.string().trim().url("Enter a valid URL"),
  customCode: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{3,64}$/, "Use 3-64 letters, numbers, underscores, or hyphens")
    .optional()
    .or(z.literal("")),
});

const deleteUrlsSchema = z.object({
  codes: z.array(z.string().trim().regex(/^[A-Za-z0-9_-]{3,64}$/)).min(1),
});

async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user?.verified) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

async function validateRequestOrigin(request: NextRequest) {
  if (request.method === "GET") {
    return null;
  }

  const headersList = await headers();
  const origin = headersList.get("origin");
  const referer = headersList.get("referer");
  const host = headersList.get("host");

  if (!origin && !referer) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  if (origin && host && !origin.includes(host)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  if (referer && host && !referer.includes(host)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  return null;
}

function getWorkerConfig() {
  const baseUrl = process.env.SHORTENER_WORKER_URL?.replace(/\/$/, "");
  const apiSecret = process.env.SHORTENER_API_SECRET;

  if (!baseUrl || !apiSecret) {
    return null;
  }

  return { baseUrl, apiSecret };
}

async function proxyWorkerResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  }

  const body = await response.text();
  return NextResponse.json(
    { error: body || "Shortener worker request failed" },
    { status: response.status }
  );
}

async function callWorker(path: string, init?: RequestInit) {
  const config = getWorkerConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Shortener worker environment variables are missing" },
      { status: 500 }
    );
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${config.apiSecret}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  return proxyWorkerResponse(response);
}

export async function GET(request: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();
  const limit = searchParams.get("limit") || "20";
  const cursor = searchParams.get("cursor");
  const prefix = searchParams.get("prefix");

  params.set("limit", limit);
  if (cursor) params.set("cursor", cursor);
  if (prefix) params.set("prefix", prefix);

  return callWorker(`/admin/urls?${params.toString()}`);
}

export async function POST(request: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const requestError = await validateRequestOrigin(request);
  if (requestError) return requestError;

  try {
    const body = addUrlSchema.parse(await request.json());

    return callWorker("/admin/urls", {
      method: "POST",
      body: JSON.stringify({
        longUrl: body.longUrl,
        customCode: body.customCode || undefined,
      }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await checkAdminAuth();
  if (authError) return authError;

  const requestError = await validateRequestOrigin(request);
  if (requestError) return requestError;

  try {
    const body = deleteUrlsSchema.parse(await request.json());

    return callWorker("/admin/urls", {
      method: "DELETE",
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 });
    }

    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
