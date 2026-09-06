import { headers } from "next/headers";
import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const instant = false;

export default async function SignupPage() {
    const nonce = (await headers()).get('x-nonce') ?? undefined;
    return (
        <Suspense fallback={<div>Loading Signup page...</div>}>
            <SignupForm nonce={nonce} />
        </Suspense>
    );
}
