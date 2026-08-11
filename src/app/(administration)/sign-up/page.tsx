import { Suspense } from "react";
import { SignupForm } from "@/components/auth/SignupForm";

export const instant = false;

export default function SignupPage() {
    return (
        <Suspense fallback={<div>Loading Signup page...</div>}>
            <SignupForm />
        </Suspense>
    );
}
