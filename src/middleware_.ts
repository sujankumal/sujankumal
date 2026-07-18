export { auth as middleware } from "./services/auth"

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
