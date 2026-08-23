import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: '/log-in',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user && typeof (user as any).verified !== "undefined") {
        token.verified = (user as any).verified;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.verified = token.verified as boolean;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;