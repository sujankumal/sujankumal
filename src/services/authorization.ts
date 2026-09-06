import { NextResponse } from "next/server";
import { auth } from "@/services/auth";
import prisma from "@/../prisma/prisma";

type AuthorizedUser = {
  id: number;
  email: string | null;
  verified: boolean;
};

type AuthorizationResult =
  | { user: AuthorizedUser; response: null }
  | { user: null; response: NextResponse };

export async function getCurrentUser(): Promise<AuthorizedUser | null> {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, verified: true },
  });
}

/** Returns the current verified user, or null when access is not allowed. */
export async function getVerifiedUser(): Promise<AuthorizedUser | null> {
  const user = await getCurrentUser();
  return user?.verified ? user : null;
}

/**
 * Authenticates the request and reads the current user from the database.
 * The JWT is used only to identify the user.
 */
export async function requireAuthenticatedUser(): Promise<AuthorizationResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

/**
 * Requires the current database record to have verified admin access.
 */
export async function requireVerifiedUser(): Promise<AuthorizationResult> {
  const user = await getVerifiedUser();
  return user
    ? { user, response: null }
    : {
        user: null,
        response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
}
