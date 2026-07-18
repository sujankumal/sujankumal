'use client'
import { UserType } from "@/types/user";
import { Person } from "@mui/icons-material";
import Link from "next/link";
import { ToastContainer, toast } from 'react-toastify';

function UserLinkButton({ user }: { user: UserType }) {
    return (user) ? <div className="inline-flex text-gray-500 italic">
        <Person className="flex-row self-center" fontSize="small" />
        <Link className="hover:text-orange-600 ml-1 inline-flex flex-row self-center"
            href={"/#"}
            onNavigate={(e) => {
                // Only executes during SPA navigation
                toast.info("User: " + user.name + ". Profile not found.");
                e.preventDefault()
            }}
        >
            {user.name}
        </Link>
        <ToastContainer position="bottom-right" theme="dark" />
    </div> : <></>;
}

export default UserLinkButton;