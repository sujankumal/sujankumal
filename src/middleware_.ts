// import { auth } from './services/auth';
export { auth as middleware } from "./services/auth"

// export default auth((req) => {
//   // req.auth
//   console.log("Middleware, auth: ",auth, req);
// })

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};
