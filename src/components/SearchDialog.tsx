import { searchData } from "@/services/search";
import { Paper } from "@mui/material";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

function SearchDialog() {
    const searchParams = useSearchParams();
    const query = searchParams.get('query');
    const [posts, setPosts] = useState<{ url: string; title: string }[]>([]);

    useEffect(() => {
        if (query) {
            searchData(query).then((d) => {
                setPosts(d);
            });
        } else {
            setPosts([]); // Clear posts if query is deleted
        }
    }, [query]);

    // Hide component if there are no posts
    if (!query || posts.length === 0) return null;

    return (
        <Paper
            elevation={8}
            component='div'
            className={query ? "px-1 py-1 mt-1 border-2 border-orange-600 " : "hidden"}
        >
            {
                posts.map((item: { url: string, title: string }, index) => (
                    <Link
                        href={'/articles/' + item.url}
                        key={index}
                        className="block hover:bg-gray-800 hover:text-white py-2 px-1 w-full text-center"
                    >
                        {item.title}
                    </Link>
                ))
            }
        </Paper>
    );
}

export default SearchDialog;