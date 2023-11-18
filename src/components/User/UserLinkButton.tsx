import { APP_BASE_URL } from "@/constants/config";
import { Person } from "@mui/icons-material";
import { User } from "@prisma/client";
import Link from "next/link";

function UserLinkButton({user}: {user:User}) {
    return <div className="inline-flex text-gray-500 italic">
        <Person  className="flex-row self-center" fontSize="small" />
        <Link className="hover:text-teal-600 ml-1 inline-flex flex-row self-center" href={APP_BASE_URL+"profile/"+user.id}>{user.name}</Link>
    </div>;
}

export default UserLinkButton;