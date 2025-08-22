import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      verified?: boolean;
    };
  }
  interface User extends DefaultUser {
    verified?: boolean;
  }
}
