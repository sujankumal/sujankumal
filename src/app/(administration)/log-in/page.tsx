import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const instant = false;

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading login page...</div>}>
            <LoginForm />
        </Suspense>
    );
}