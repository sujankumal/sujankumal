import { headers } from "next/headers";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const instant = false;

export default async function LoginPage() {
    const nonce = (await headers()).get('x-nonce') ?? undefined;
    return (
        <Suspense fallback={<div>Loading login page...</div>}>
            <LoginForm nonce={nonce} />
        </Suspense>
    );
}