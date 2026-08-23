import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    verified: boolean;
  }
  interface Session {
    user: {
      address?: string;
      verified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    verified?: boolean;
  }
}