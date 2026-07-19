"use client"
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

function SignOutButton({ className }: { className?: string }) {
    return <button className={`${className}`} onClick={() => signOut()}>
        <LogOut size={16} /> Sign Out</button>;
}

export default SignOutButton;