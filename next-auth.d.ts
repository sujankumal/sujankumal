import "next-auth";

declare module "next-auth" {
    interface User {
        verified: boolean;
    }
    interface Session {
        user: {
            verified: boolean;
        } & DefaultSession["user"];
    }
}