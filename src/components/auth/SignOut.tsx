"use client"
import { signOut } from "next-auth/react";

function SignOutButton() {
    return <button className="p-2 mx-2" onClick={() => signOut()}>Sign Out</button>;
}

export default SignOutButton;