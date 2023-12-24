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
  session:{
    strategy:'jwt',
  },
  callbacks:{
    async session({ session, token, user}){
      console.log("Session: ", session, "Token: ",token);
      return session;
    },
    async jwt({token, user, account, profile, trigger, session}){
      console.log("jwt:", token, user, account, profile, trigger, session );
      if(user){
        token.email = user.email
      }
      return token;
    },
    async authorized({ request, auth }) {
      const cookie = request.cookies.get('authjs.session-token')?.value;
      console.log("authjs file:", cookie, auth);
      
      // return Response.redirect(new URL('/log-in', nextUrl)); // Redirect unauthenticated users to login page
      const url = request.nextUrl
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith('/admin');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/admin', request.nextUrl));
      }
      return true;
    },
  },
});
