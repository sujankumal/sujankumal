import NextAuth, { type DefaultSession } from 'next-auth';
import { authConfig } from '../../auth.config';
declare module "@auth/core" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's postal address. */
      address: string
      // By default, TypeScript merges new interface properties and overwrite existing ones. In this case, the default session user properties will be overwritten, with the new one defined above. To keep the default session user properties, you need to add them back into the newly declared interface
    } & DefaultSession["user"] // To keep the default types
  }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token, user }) {
      // Add verified to session.user from token
      if (session.user && typeof token.verified !== "undefined") {
        session.user.verified = !!token.verified;
      }
      return session;
    },
    async jwt({ token, user, account, profile, trigger, session }) {
      if (user && typeof user.verified !== "undefined") {
        token.verified = user.verified;
      }
      return token;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified ?? false;
      }
      return true;
    },
    async authorized({ request, auth }) {
      const cookie = request.cookies.get('authjs.session-token')?.value;
      const url = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/admin');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/admin', request.nextUrl));
      }
      return true;
    },
  },
});
